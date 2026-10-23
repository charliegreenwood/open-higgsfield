# Bahkez video ad workflow

This branch adds a manual GitHub Actions workflow for generating a 30-second vertical Bahkez Team Building Uganda ad through the same Seedance 2.5 API family used by this repository.

## One-time setup

In GitHub, open:

**Settings → Secrets and variables → Actions → New repository secret**

Add only this secret:

- Name: `HF_API_KEY`
- Secret: paste the complete API key copied from the Higgsfield API key page exactly as provided.

Do **not** paste the API key into a normal repository file or commit.

The API base URL is the public Higgsfield REST endpoint and is built into the generation script:
`https://api.higgsfield.ai`

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

The prompt tells the model to keep the footage realistic and not render the phone number as visual text; the phone number is spoken in the voiceover.
