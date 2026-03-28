// server/src/module/animation/animation.worker.ts
// Handles background animation job processing:
// - calls LLM via AI provider
// - writes Python file to OS temporary directory
// - executes Manim via spawn avoiding maxBuffer limits (600s timeout)
// - uploads video to Cloudinary
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

EXAMPLE OUTPUT FORMAT:
from manim import *

class GeneratedScene(Scene):
    def construct(self):
        circle = Circle(color=BLUE)
        self.play(Create(circle))
        self.wait(1)
`;

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

  // A rogue AI might add trailing conversational text, but matching fences handles it 99% of the time.
  // We'll trust python execution or the next generation if it fails.
  return code.trim();
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

    const aiResponse = await aiService.generateText({
      prompt,
      provider,
      model,
      apiKey: apiKey ?? getProviderApiKey(provider),
      systemPrompt: MANIM_SYSTEM_PROMPT,
      temperature: 0.3,
    });

    console.log(`[Worker][${jobId}] AI response received (${aiResponse.text.length} chars)`);

    const generatedCode = extractPythonCode(aiResponse.text);

    if (!generatedCode || !generatedCode.includes('class GeneratedScene')) {
      throw new Error('AI did not return a valid GeneratedScene class. Raw output:\n' + aiResponse.text.substring(0, 500));
    }

    await updateJob(jobId, { status: 'generating_code', generatedCode });
    console.log(`[Worker][${jobId}] Generated code saved to DB`);

    // ── Step 3: Write Python file to /tmp ────────────────────────────────────
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(pyFile, generatedCode, 'utf-8');
    console.log(`[Worker][${jobId}] Python file written: ${pyFile}`);

    // ── Step 4: Render with Manim ────────────────────────────────────────────
    await updateJob(jobId, { status: 'rendering' });
    console.log(`[Worker][${jobId}] Status → rendering`);
    console.log(`[Worker][${jobId}] Running: python3 -m manim render -ql ${pyFile} GeneratedScene`);

    console.log(`[Worker][${jobId}] Starting Manim process using spawn...`);
    await new Promise<void>((resolve, reject) => {
      // Use spawn to avoid maxBuffer limits on heavy stdout logs
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
        // Console error might be too noisy for standard Manim progress, but keeping it
        // logged ensures we capture all debug info.
        console.error(`[Worker][${jobId}] STDERR: ${text.trim()}`);
      });

      child.on('close', (code) => {
        console.log(`[Worker][${jobId}] Manim process exited with code ${code}`);
        if (code === 0) {
          resolve();
        } else {
          // Sometimes Manim returns non-zero even if video is generated, but strictly we should error
          reject(new Error(`Manim render failed with code ${code}.`));
        }
      });

      child.on('error', (spawnErr) => {
        console.error(`[Worker][${jobId}] Manim process error:`, spawnErr);
        reject(spawnErr);
      });
    });

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

    try {
      await updateJob(jobId, { status: 'failed', errorMessage });
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
