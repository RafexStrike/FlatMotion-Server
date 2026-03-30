// server/src/module/animation/animation.worker.ts
// Handles background animation job processing:
// - calls LLM via AI provider
// - writes Python file to OS temporary directory
// - executes Manim via spawn avoiding maxBuffer limits (600s timeout)
// - auto-retries up to MAX_RETRIES on render failure (sends errors back to AI)
// - uploads video to Cloudinary

const MAX_RETRIES = 10;
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { aiService } from '../ai/ai.service';
import { uploadVideo } from '../../lib/cloudinary';
import { updateJob } from './animation.service';

// ─── Manim System Prompt ──────────────────────────────────────────────────────

const MANIM_SYSTEM_PROMPT = `You are a Manim code generator. Your ONLY job is to output valid, self-contained Python code using the Manim Community library (manim).

CRITICAL STRICT RULES:
1. Output ONLY raw Python code. DO NOT include any markdown formatting (like \`\`\`python). DO NOT include any conversational text, explanations, or greetings. Your entire response must be executable Python code.
2. The scene class MUST be named "GeneratedScene".
3. The class must extend Scene from manim.
4. Use "from manim import *" as the first import.
5. The animation must run for at most 10 seconds.
6. Use only standard Manim objects and animations (e.g., Circle, Square, Text, Arrow, MathTex, Create, FadeIn, Transform, etc).
7. Do NOT use any external files, images, or network calls.
8. The construct method must be self-contained.
9. Keep the code simple and reliable — it must render without errors.

MANIM API RULES (VERY IMPORTANT — violations WILL cause render failures):

OPACITY:
- Do NOT use "opacity" as a constructor kwarg. Use "fill_opacity" or "stroke_opacity" instead.
  WRONG: Dot(opacity=0.3)
  RIGHT: Dot(fill_opacity=0.3)
- To change opacity after creation, use .set_opacity(), .set_fill(opacity=x), or .set_stroke(opacity=x).

AXES & NUMBER LINES:
- Do NOT use "numbers_with_elongated_tick" — it does not exist.
- Keep axis configs minimal: x_range=[min, max, step], y_range=[min, max, step], axis_config={"color": GRAY}.
- Do NOT use axes.get_x_axis().get_tick_labels() or axes.get_y_axis().get_tick_labels() — they are deprecated/broken.
- If you need axis labels, use axes.get_axis_labels(x_label="x", y_label="y") only.
- For plotting functions, use axes.plot(lambda x: ...) instead of axes.get_graph().

FRAME DIMENSIONS:
- Do NOT use FRAME_WIDTH or FRAME_HEIGHT as standalone constants — they don't exist.
  WRONG: x_range=[-FRAME_WIDTH/2, FRAME_WIDTH/2]
  RIGHT: x_range=[-config.frame_width/2, config.frame_width/2]
  Or simply use fixed numeric values like x_range=[-7, 7, 1].

ANIMATION GROUPS:
- AnimationGroup does NOT have .set_start_time(). Do NOT call it.
- For staggered animations, use LaggedStart(*animations, lag_ratio=0.2).
- For sequential animations, use Succession(anim1, anim2, ...).

PERFORMANCE:
- Avoid creating thousands of Mobjects (e.g., a dense grid of Dots). This causes extreme slowness or crashes.
  Instead of per-pixel dot grids, use ParametricFunction, FunctionGraph, or a small number of objects.
- Keep scenes simple: prefer fewer, larger geometric objects over many tiny ones.

UPDATERS:
- For updater-based continuous animations, use .add_updater() with self.wait(duration).
- Use color constants like BLUE, RED, GREEN, YELLOW, PURPLE, WHITE, GRAY, BLACK directly.
- For color interpolation, use interpolate_color(color1, color2, alpha).

EXAMPLE OUTPUT FORMAT:
from manim import *

class GeneratedScene(Scene):
    def construct(self):
        circle = Circle(color=BLUE)
        self.play(Create(circle))
        self.wait(1)
`;

// ─── Retry Prompt ─────────────────────────────────────────────────────────────

/**
 * Builds a retry prompt that includes the current failed code, the current error,
 * and all previously encountered errors so the AI doesn't repeat the same mistakes.
 */
function buildRetryPrompt(
  currentCode: string,
  currentError: string,
  previousErrors: string[],
  attemptNumber: number
): string {
  let previousErrorsSection = '';
  if (previousErrors.length > 0) {
    previousErrorsSection = `\n\nPREVIOUS ERRORS THAT ALREADY OCCURRED (do NOT repeat these mistakes):\n${previousErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n`;
  }

  return `The following Manim Python code failed to render (attempt ${attemptNumber}). Fix the code so it renders successfully.

FAILED CODE:
${currentCode}

CURRENT ERROR:
${currentError}${previousErrorsSection}
RULES:
- Output ONLY the fixed Python code. No explanations, no markdown.
- The class must still be named "GeneratedScene".
- Use "from manim import *" as the first import.
- Do NOT use "opacity" as a constructor kwarg. Use "fill_opacity" or "stroke_opacity" instead.
- Do NOT use "numbers_with_elongated_tick" — it does not exist.
- Do NOT use FRAME_WIDTH or FRAME_HEIGHT. Use config.frame_width / config.frame_height or fixed numeric values.
- Do NOT use axes.get_x_axis().get_tick_labels() — it is deprecated. Use axes.get_axis_labels() instead.
- Do NOT call .set_start_time() on AnimationGroup — it doesn't exist. Use LaggedStart or Succession instead.
- Do NOT use axes.get_graph() — use axes.plot() instead.
- Keep axis configs minimal and avoid unknown kwargs.
- Avoid creating thousands of tiny Mobjects (dots in a dense grid). Use ParametricFunction or FunctionGraph instead.
- The animation must be at most 10 seconds.
- Make sure the code renders without any errors.`;
}

// ─── Code Extraction ──────────────────────────────────────────────────────────

/**
 * Strips markdown fences from LLM output and extracts raw Python code.
 */
function extractPythonCode(raw: string): string {
  // Extract from markdown fences if present
  const match = raw.match(/```(?:python)?\s*([\s\S]*?)```/i);
  let code = match ? match[1] : raw;

  // Find the start of the actual Python code to ignore conversational prefixes
  let startIndex = code.indexOf('from manim');
  if (startIndex === -1) startIndex = code.indexOf('import manim');
  if (startIndex === -1) startIndex = code.indexOf('class GeneratedScene');

  if (startIndex > 0) {
    code = code.substring(startIndex);
  }

  return code.trim();
}

// ─── Manim Error Parsing ──────────────────────────────────────────────────────

/**
 * Extracts a meaningful Python error from Manim stderr output.
 * Returns the last error line (e.g., "TypeError: Mobject.__init__() got an unexpected keyword argument 'opacity'")
 */
function extractPythonError(stderr: string): string | null {
  // Look for common Python error patterns at the end of the traceback
  const lines = stderr.split('\n').map(l => l.trim()).filter(Boolean);

  // Check for "No module named" which appears on a single line without standard traceback
  for (const line of lines) {
    if (line.includes('No module named')) {
      return `ModuleNotFoundError: ${line}`;
    }
  }

  // Search from the end for typical Python error lines
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (
      line.match(/^(TypeError|ValueError|AttributeError|NameError|ImportError|SyntaxError|RuntimeError|KeyError|IndexError|ZeroDivisionError|ModuleNotFoundError|RecursionError|MemoryError|OverflowError):/) ||
      line.match(/^manim\..*Error:/)
    ) {
      return line;
    }
  }

  return null;
}

/**
 * Converts a technical Manim error into a user-friendly message.
 */
function makeUserFriendlyError(pythonError: string | null, retried: boolean): string {
  const retryNote = retried
    ? ' We attempted to automatically fix the issue, but it persisted.'
    : '';

  if (!pythonError) {
    return `We couldn't render this animation. The rendering engine encountered an unexpected issue.${retryNote} Please try rephrasing your prompt or simplifying the description.`;
  }

  if (pythonError.includes('unexpected keyword argument')) {
    return `We couldn't render this animation. The AI generated code with features not supported by our rendering engine.${retryNote} Please try a simpler prompt or rephrase your description.`;
  }

  if (pythonError.includes('MemoryError') || pythonError.includes('RecursionError')) {
    return `We couldn't render this animation — it was too complex for our rendering engine to handle.${retryNote} Please try a simpler animation with fewer elements.`;
  }

  if (pythonError.includes('No module named manim')) {
    return `Our animation rendering engine is temporarily unavailable due to a server configuration issue. This is not related to your prompt — please try again later or contact support.`;
  }

  if (pythonError.includes('ModuleNotFoundError') || pythonError.includes('ImportError')) {
    return `We couldn't render this animation due to a missing dependency on our server.${retryNote} Please try a different prompt that uses basic shapes and animations.`;
  }

  if (pythonError.includes('SyntaxError')) {
    return `We couldn't render this animation. The AI generated code with a syntax error.${retryNote} Please try rephrasing your prompt.`;
  }

  if (pythonError.includes('AttributeError')) {
    return `We couldn't render this animation. The AI used a feature that isn't available in our rendering engine.${retryNote} Please try a simpler description.`;
  }

  return `We couldn't render this animation. Our rendering engine encountered an error while processing the AI-generated code.${retryNote} Please try rephrasing your prompt or using a simpler description.`;
}

// ─── Manim Render ─────────────────────────────────────────────────────────────

interface RenderResult {
  success: boolean;
  stderr: string;
  pythonError: string | null;
}

/**
 * Runs Manim render and returns success/failure + captured stderr.
 */
async function runManimRender(
  jobId: string,
  pyFile: string,
  tmpDir: string
): Promise<RenderResult> {
  return new Promise<RenderResult>((resolve) => {
    let stderrBuffer = '';

    const child = spawn('python3', [
      '-m', 'manim', 'render', '-ql', '--media_dir', tmpDir, pyFile, 'GeneratedScene'
    ], {
      timeout: 600_000 // 10 min timeout for Render Free tier
    });

    child.stdout.on('data', (data) => {
      const text = data.toString();
      console.log(`[Worker][${jobId}] STDOUT: ${text.trim()}`);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderrBuffer += text;
      console.error(`[Worker][${jobId}] STDERR: ${text.trim()}`);
    });

    child.on('close', (code) => {
      console.log(`[Worker][${jobId}] Manim process exited with code ${code}`);
      if (code === 0) {
        resolve({ success: true, stderr: stderrBuffer, pythonError: null });
      } else {
        const pythonError = extractPythonError(stderrBuffer);
        resolve({ success: false, stderr: stderrBuffer, pythonError });
      }
    });

    child.on('error', (spawnErr) => {
      console.error(`[Worker][${jobId}] Manim process error:`, spawnErr);
      resolve({ success: false, stderr: spawnErr.message, pythonError: null });
    });
  });
}

// ─── Worker Pipeline ──────────────────────────────────────────────────────────

/**
 * Main async pipeline for processing an animation job.
 * Called fire-and-forget after job creation — does NOT throw.
 */
export async function processAnimationJob(
  jobId: string,
  prompt: string,
  provider: string,
  model: string,
  apiKey?: string
): Promise<void> {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`[Worker] Starting pipeline for job: ${jobId}`);
  console.log(`[Worker] Provider: ${provider} | Model: ${model}`);
  console.log(`[Worker] Prompt: ${prompt.substring(0, 100)}...`);
  console.log(`${'═'.repeat(60)}`);

  // Temp file paths - Using OS temp directory
  const tmpDir = path.join(os.tmpdir(), `manim-job-${jobId}`);
  const pyFile = path.join(tmpDir, 'scene.py');
  let videoPath: string | null = null;

  try {
    // ── Step 1: Mark as processing ──────────────────────────────────────────
    await updateJob(jobId, { status: 'processing' });
    console.log(`[Worker][${jobId}] Status → processing`);

    // ── Step 2: Generate Manim code via AI ──────────────────────────────────
    await updateJob(jobId, { status: 'generating_code' });
    console.log(`[Worker][${jobId}] Status → generating_code`);
    console.log(`[Worker][${jobId}] Calling AI provider...`);

    const resolvedKey = apiKey ?? getProviderApiKey(provider);

    const aiResponse = await aiService.generateText({
      prompt,
      provider,
      model,
      apiKey: resolvedKey,
      systemPrompt: MANIM_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    console.log(`[Worker][${jobId}] AI response received (${aiResponse.text.length} chars)`);

    let generatedCode = extractPythonCode(aiResponse.text);

    if (!generatedCode || !generatedCode.includes('class GeneratedScene')) {
      throw new Error('AI did not return a valid GeneratedScene class. Raw output:\n' + aiResponse.text.substring(0, 500));
    }

    await updateJob(jobId, { status: 'generating_code', generatedCode });
    console.log(`[Worker][${jobId}] Generated code saved to DB`);

    // ── Step 3: Write Python file to /tmp ────────────────────────────────────
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(pyFile, generatedCode, 'utf-8');
    console.log(`[Worker][${jobId}] Python file written: ${pyFile}`);

    // ── Step 4: Render with Manim (with up to MAX_RETRIES auto-retries) ───────
    await updateJob(jobId, { status: 'rendering' });
    console.log(`[Worker][${jobId}] Status → rendering`);
    console.log(`[Worker][${jobId}] Running: python3 -m manim render -ql ${pyFile} GeneratedScene`);

    let renderResult = await runManimRender(jobId, pyFile, tmpDir);
    const allErrors: string[] = [];
    let retryCount = 0;

    // ── Auto-retry loop ──────────────────────────────────────────────────────
    while (
      !renderResult.success &&
      renderResult.pythonError &&
      retryCount < MAX_RETRIES
    ) {
      // Skip retry if manim itself is missing — no code fix can help
      if (renderResult.pythonError.includes('No module named manim')) {
        console.log(`[Worker][${jobId}] ❌ Manim is not installed — cannot retry.`);
        break;
      }

      retryCount++;
      allErrors.push(renderResult.pythonError);

      console.log(`[Worker][${jobId}] ⚠ Render attempt ${retryCount} failed: ${renderResult.pythonError}`);
      console.log(`[Worker][${jobId}] 🔄 Auto-retry ${retryCount}/${MAX_RETRIES}...`);

      await updateJob(jobId, { status: 'generating_code' });

      const retryPrompt = buildRetryPrompt(
        generatedCode,
        renderResult.pythonError,
        allErrors.slice(0, -1), // all previous errors excluding the current one
        retryCount
      );

      try {
        const retryResponse = await aiService.generateText({
          prompt: retryPrompt,
          provider,
          model,
          apiKey: resolvedKey,
          systemPrompt: MANIM_SYSTEM_PROMPT,
          temperature: Math.max(0.1, 0.3 - retryCount * 0.02), // Decrease temp with each retry
        });

        console.log(`[Worker][${jobId}] Retry ${retryCount} AI response received (${retryResponse.text.length} chars)`);

        const retriedCode = extractPythonCode(retryResponse.text);

        if (!retriedCode || !retriedCode.includes('class GeneratedScene')) {
          console.log(`[Worker][${jobId}] Retry ${retryCount}: AI did not return valid code, stopping retries.`);
          break;
        }

        generatedCode = retriedCode;
        await updateJob(jobId, { status: 'generating_code', generatedCode });
        console.log(`[Worker][${jobId}] Retry ${retryCount} code saved to DB`);

        // Clean previous temp files and write new code
        if (fs.existsSync(tmpDir)) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        fs.mkdirSync(tmpDir, { recursive: true });
        fs.writeFileSync(pyFile, generatedCode, 'utf-8');

        await updateJob(jobId, { status: 'rendering' });
        console.log(`[Worker][${jobId}] 🔄 Retry ${retryCount} render starting...`);

        renderResult = await runManimRender(jobId, pyFile, tmpDir);

        if (renderResult.success) {
          console.log(`[Worker][${jobId}] ✅ Retry ${retryCount} render succeeded!`);
        } else {
          console.log(`[Worker][${jobId}] ❌ Retry ${retryCount} failed: ${renderResult.pythonError || 'unknown error'}`);
        }
      } catch (retryErr: any) {
        console.error(`[Worker][${jobId}] Retry ${retryCount} AI call failed:`, retryErr.message);
        break; // Stop retrying if AI call itself fails
      }
    }

    // ── Check final render result ────────────────────────────────────────────
    if (!renderResult.success) {
      const wasRetried = retryCount > 0;
      const friendlyMessage = makeUserFriendlyError(renderResult.pythonError, wasRetried);
      throw new Error(friendlyMessage);
    }

    console.log(`[Worker][${jobId}] Manim execution completed successfully.`);

    // Locate the output mp4 — Manim places it under media/videos/scene/480p15/
    videoPath = findMp4File(tmpDir);
    if (!videoPath) {
      throw new Error('Manim render completed but no mp4 file was found in output directory.');
    }
    console.log(`[Worker][${jobId}] Video file found: ${videoPath}`);

    // ── Step 5: Upload to Cloudinary ─────────────────────────────────────────
    await updateJob(jobId, { status: 'uploading' });
    console.log(`[Worker][${jobId}] Status → uploading`);

    const uploadResult = await uploadVideo(videoPath, 'animation-jobs');
    console.log(`[Worker][${jobId}] Cloudinary upload complete: ${uploadResult.secureUrl}`);

    // ── Step 6: Finalize ─────────────────────────────────────────────────────
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await updateJob(jobId, {
      status: 'done',
      videoUrl: uploadResult.secureUrl,
      cloudinaryId: uploadResult.publicId,
      expiresAt,
    });

    console.log(`[Worker][${jobId}] Status → done ✓`);
    console.log(`[Worker][${jobId}] Video URL: ${uploadResult.secureUrl}`);

  } catch (err: any) {
    const errorMessage = err?.message || 'Unknown error during animation pipeline';
    console.error(`[Worker][${jobId}] FAILED:`, errorMessage);

    // If the error is already user-friendly (from makeUserFriendlyError), use it directly.
    // Otherwise, wrap it in a generic user-friendly message.
    const isAlreadyFriendly = errorMessage.startsWith("We couldn't render");
    const userMessage = isAlreadyFriendly
      ? errorMessage
      : `Something went wrong while creating your animation. Please try again with a different prompt.`;

    try {
      await updateJob(jobId, { status: 'failed', errorMessage: userMessage });
    } catch (dbErr: any) {
      console.error(`[Worker][${jobId}] Could not save failure to DB:`, dbErr.message);
    }
  } finally {
    // ── Cleanup temp files ───────────────────────────────────────────────────
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        console.log(`[Worker][${jobId}] Temp directory cleaned up`);
      }
    } catch (cleanupErr: any) {
      console.warn(`[Worker][${jobId}] Cleanup warning:`, cleanupErr.message);
    }

    console.log(`${'─'.repeat(60)}`);
    console.log(`[Worker][${jobId}] Pipeline finished`);
    console.log(`${'─'.repeat(60)}\n`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Recursively searches for the first .mp4 file under a directory.
 */
function findMp4File(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findMp4File(fullPath);
      if (found) return found;
    } else if (entry.isFile() && entry.name.endsWith('.mp4')) {
      return fullPath;
    }
  }
  return null;
}

/**
 * Resolves the server-side API key for a given provider from environment variables.
 * Falls back gracefully if none found (caller should patch in their own key).
 */
function getProviderApiKey(provider: string): string {
  const keyMap: Record<string, string | undefined> = {
    gemini: process.env.GEMINI_API_KEY,
    huggingface: process.env.HF_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  };

  const key = keyMap[provider.toLowerCase()];
  if (!key) {
    throw new Error(
      `No API key found for provider "${provider}". Set the corresponding env var or pass apiKey in the request.`
    );
  }
  return key;
}
