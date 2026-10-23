# Bahkez video ad workflow

This branch adds a manual GitHub Actions workflow for generating a 30-second vertical Bahkez Team Building Uganda ad through the same Seedance 2.5 API mapping used by this repository.

## What you need to add once

In GitHub, open:

**Settings → Secrets and variables → Actions → New repository secret**

Add these two secrets:

1. `HF_API_BASE_URL`
   - The generation API base URL used by your OpenHiggsfield instance.
   - Do not include a trailing slash.

2. `HF_PLATFORM_KEY`
   - Your platform key in the same `id:secret` format expected by the app.

Do **not** paste either value into a file or commit.

## How to generate the ad

After this branch is merged:

1. Open the **Actions** tab.
2. Choose **Generate Bahkez Team Building Ad**.
3. Click **Run workflow**.
4. Leave the prompt override blank to use the prepared ad.
5. When the run finishes, open it and download the `bahkez-team-building-ad` artifact.

The artifact contains:

`bahkez-team-building-ad.mp4`

The workflow asks Seedance 2.5 for:
- 9:16 vertical
- 720p
- 30 seconds
- MP4
- generated audio

The script intentionally tells the model not to render the phone number as visual text because AI-generated text can be unreliable; the phone number is spoken in the voiceover.
