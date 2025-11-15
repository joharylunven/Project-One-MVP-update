# Project One: AI-Powered Brand Analyzer & Campaign Generator

`Project One` is a web application that analyzes any website to extract its **"Brand DNA"** (colors, fonts, tone, concept). It then uses this DNA to generate personalized **AI-powered marketing campaign ideas** (via Google Gemini).

This project consists of a static frontend (HTML, CSS, JS) and a powerful backend orchestrated by **n8n** that handles all external API calls.

## 🚀 Features

  * **Website Analysis:** Extracts a brand's DNA (name, tagline, colors, fonts, images, etc.) from just a URL.
  * **Dynamic Dashboard:** Displays the extracted Brand DNA in a clean, organized UI (Page 3).
  * **AI Campaign Generation:** Sends the Brand DNA to a second webhook that uses Google Gemini to generate 3 unique, relevant marketing campaign ideas.
  * **Multi-Step Interface:** A smooth, 4-page "Single Page Application" (SPA) experience managed with JavaScript, with no page reloads.
  * **Decoupled Architecture:** The frontend is fully static and communicates with an n8n backend, making it easy to deploy and maintain.

## ⚙️ How It Works (Architecture)

The application follows a two-phase data flow, orchestrated entirely by the frontend and n8n.

-----

### Phase 1: DNA Analysis (Pages 1-3)

1.  **Frontend (Page 1):** The user enters a website URL.
2.  **Frontend (JS):** A `POST` request is sent to **Webhook 1 (Analyze)** with the `{"url": "..."}` in the body.
3.  **n8n (Webhook 1):** Receives the URL. It then calls a scraping API (like ScrapingBee) using the `ai_extract_rules` you defined.
4.  **n8n (Webhook 1):** Returns the final extracted JSON data to the frontend.
5.  **Frontend (Page 3):** `script.js` receives the JSON, stores it in the `currentBusinessDNA` variable, and uses the `populateDnaPage` function to dynamically fill Page 3.

-----

### Phase 2: Campaign Generation (Pages 3-4)

1.  **Frontend (Page 3):** The user clicks the "Looks good" button.
2.  **Frontend (JS):** The `showPage('#page-4')` function is called, which in turn triggers `triggerSuggestionLoading`.
3.  **Frontend (JS):** This function sends a `POST` request to **Webhook 2 (Campaigns)**. The *entire* `currentBusinessDNA` object (from Phase 1) is sent as the JSON body.
4.  **n8n (Webhook 2):** Receives the Brand DNA. It formats this data into a prompt for the **Google Gemini** node (e.g., "Based on this brand DNA, generate 3 campaign ideas...").
5.  **n8n (Webhook 2):** Returns a JSON array of the 3 campaign ideas (e.g., `[ {title, description, imageUrl}, ... ]`) to the frontend.
6.  **Frontend (Page 4):** The `populateCampaignPage` function receives this array and dynamically creates the 3 campaign suggestion cards.

## 🛠️ Tech Stack

  * **Frontend:** HTML5, CSS3, JavaScript (ES6+ `async/await`, `fetch`)
  * **Backend:** n8n (self-hosted or Cloud)
  * **External APIs:**
      * **ScrapingBee** (for website scraping & AI extraction)
      * **Google Gemini** (for campaign idea generation)

## 🔧 Installation & Setup

To run this project, you need to set up both the frontend and the n8n backend.

### 1\. Frontend

1.  **Clone this repository:**

    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Run a local server:**
    You must serve these files from a local server for the `fetch` API calls to work (due to CORS policy).

    ```bash
    # If you have Node.js, you can use 'live-server'
    npm install -g live-server
    live-server
    ```

    Or, you can use a simple Python server:

    ```bash
    # Python 3
    python -m http.server
    ```

    Open `http://localhost:8000` (or the port provided) in your browser.

3.  **Update Webhook URLs:**
    Open `script.js` and change these two constants to match *your* n8n webhook URLs:

    ```javascript
    const N8N_DNA_WEBHOOK_URL = 'http://localhost:5678/webhook-test/analyse-site';
    const N8N_CAMPAIGN_WEBHOOK_URL = 'http://localhost:5678/webhook-test/generate-campaigns';
    ```

### 2\. Backend (n8n)

You need to create two workflows in your n8n instance.

> **⚠️ CRITICAL:** For both workflows, the starting **Webhook** node's **"Response"** setting *must* be set to **"Using Last Node"**. This forces n8n to wait for the API calls to finish before sending data back to the frontend.

-----

#### Workflow 1: `analyse-site`

  * **Trigger:** **Webhook** Node
      * **Method:** `POST`
      * **Path:** `webhook-test/analyse-site` (or your custom path)
      * **Response:** `Using Last Node`
  * **Step 2:** **HTTP Request** Node (for ScrapingBee)
      * **Method:** `GET`
      * **URL:** `https://app.scrapingbee.com/api/v1`
      * **Options (Query Parameters):**
          * `api_key`: `YOUR_SCRAPINGBEE_API_KEY`
          * `url`: `{{ $json.body.url }}` (This expression gets the URL from the webhook)
          * `ai_extract_rules`: `(Paste your large JSON extraction rules here)`
  * **Output:** The final node must output in the format `{"json": { ... }}` because `script.js` expects to read `n8nResponse.json`. You can use a **Set** node to ensure this structure.

-----

#### Workflow 2: `generate-campaigns`

  * **Trigger:** **Webhook** Node
      * **Method:** `POST`
      * **Path:** `webhook-test/generate-campaigns` (or your custom path)
      * **Response:** `Using Last Node`
  * **Step 2:** **Gemini** Node (or any AI node)
      * **Prompt:** Your prompt should use data from the webhook. The entire Brand DNA is in `{{ $json.body }}`.
      * **Example Prompt:**
        ```
        Based on the following Brand DNA, generate 3 unique marketing campaign ideas.
        Brand Name: {{ $json.body.projectName }}
        Tagline: {{ $json.body.tagline }}
        Industry: {{ $json.body.overview.industry }}
        Tone: {{ $json.body.tone.join(', ') }}
        Values: {{ $json.body.values.join(', ') }}

        Return your response as a JSON array in this exact format:
        [
          {"title": "Campaign Title 1", "description": "A short description.", "imageUrl": "URL_for_a_relevant_stock_image"},
          {"title": "Campaign Title 2", "description": "A short description.", "imageUrl": "URL_for_a_relevant_stock_image"},
          {"title": "Campaign Title 3", "description": "A short description.", "imageUrl": "URL_for_a_relevant_stock_image"}
        ]
        ```
  * **Output:** The final node must return the JSON array, which will be sent back to `script.js` and used by `populateCampaignPage`.
