import { writeFile } from "node:fs/promises";

const TERMINAL = new Set(["completed", "failed", "nsfw", "canceled"]);
const POLL_MS = 4000;
const DEADLINE_MS = 10 * 60_000;

const DEFAULT_PROMPT = `
Create a realistic 30-second vertical social media video advertisement for Bahkez Team Building Uganda.

AUDIENCE:
Ugandan business owners, HR managers, operations managers, company directors, NGO leaders and managers responsible for staff performance, morale and culture.

STYLE:
Premium but realistic documentary-commercial. It should feel filmed in Uganda with real African corporate employees, not like glossy AI stock footage. Natural skin texture, believable hands and anatomy, practical corporate-casual clothing, genuine expressions, natural daylight, subtle handheld camera movement, restrained cinematic grading, realistic motion and environments. Avoid plastic skin, surreal motion, impossible crowds, exaggerated acting, fake lens flares, hyper-saturated CGI and obvious AI aesthetics.

FORMAT:
9:16 vertical, 30 seconds, fast but human pacing, strong first 2 seconds, social-ad rhythm.

STORY:
0-5s: Open inside a believable Ugandan office. Show subtle employee burnout: tired expressions, repetitive routine, low-energy meeting, weak engagement. Do not make anyone look depressed or incompetent.
5-9s: Show the cost: disconnected communication, low energy and people working beside each other without real connection.
9-11s: Strong visual transition into an outdoor team-building experience.
11-23s: Show diverse African corporate staff doing energetic cooperative challenges, communication games, friendly competition, problem-solving activities and team exercises. Capture real laughter, teammates encouraging each other, leaders participating, high-fives, teamwork and movement.
23-27s: Show the result: stronger connection, confidence, trust, collaboration and a re-energized team.
27-30s: Finish on a strong authentic group moment with clean negative space for a phone-number CTA to be added in editing.

VOICEOVER:
Use a natural, confident adult East African English voice. It should sound conversational and human, not like a robotic announcer. Use natural pauses and a slight rise in energy after the problem section. Speak exactly this script:

"Your team isn’t lazy. They may just be burned out. Same desks, same pressure, same routine — and eventually communication, energy and teamwork start to drop. Bahkez Team Building Uganda changes that. We create high-energy team experiences that get your people moving, laughing, competing, communicating and reconnecting. Stronger trust. Better collaboration. A team that comes back to work recharged. Planning a team-building day for your company? Contact Bahkez Team Building Uganda on zero seven zero three, seven seven nine, nine eight four today."

Do not generate written text, captions, logos or phone numbers inside the footage. Keep the visuals realistic and synchronized to the emotional progression of the narration.
`.trim();

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function readJson(response) {
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; }
  catch { body = text; }
  if (!response.ok) {
    throw new Error(`Platform request failed (${response.status}): ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  const baseUrl = required("HF_API_BASE_URL").replace(/\/$/, "");
  const apiKey = required("HF_PLATFORM_KEY");
  if (!apiKey.includes(":")) throw new Error("HF_PLATFORM_KEY must use the repo's id:secret format.");

  const prompt = process.env.BAHKEZ_PROMPT?.trim() || DEFAULT_PROMPT;
  const output = process.env.OUTPUT_FILE || "bahkez-team-building-ad.mp4";

  console.log("Submitting Bahkez ad to Seedance 2.5...");
  const queued = await readJson(await fetch(`${baseUrl}/bytedance/seedance-2.5/text-to-video`, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      resolution: "720p",
      generate_audio: true,
      duration: 30,
      output_format: "mp4",
      aspect_ratio: "9:16",
    }),
  }));

  const requestId = queued?.request_id;
  if (!requestId) throw new Error("Generation platform did not return request_id.");
  console.log(`Queued request: ${requestId}`);

  const deadline = Date.now() + DEADLINE_MS;
  let status;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    status = await readJson(await fetch(`${baseUrl}/requests/${encodeURIComponent(requestId)}/status`, {
      headers: { Authorization: `Key ${apiKey}` },
    }));

    console.log(`Status: ${status?.status ?? "unknown"}`);
    if (TERMINAL.has(status?.status)) break;
  }

  if (!status || !TERMINAL.has(status?.status)) {
    throw new Error("Timed out waiting for the generation platform.");
  }
  if (status.status !== "completed") {
    throw new Error(`Generation ended with status "${status.status}": ${JSON.stringify(status.error ?? status)}`);
  }

  const videoUrl = status?.video?.url;
  if (!videoUrl) throw new Error("Completed generation did not include video.url.");

  console.log("Downloading finished MP4...");
  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`Could not download finished video (${response.status}).`);
  await writeFile(output, Buffer.from(await response.arrayBuffer()));
  console.log(`Saved ${output}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
