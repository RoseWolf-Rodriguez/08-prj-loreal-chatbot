/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const workerUrl = "https://test.lteretto.workers.dev/";

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's message from the input field
  const userMessage = userInput.value.trim();

  // Don't send empty messages
  if (!userMessage) return;

  // Show user's message in chat window
  chatWindow.innerHTML = `<div><strong>You:</strong> ${userMessage}</div>`;

  // Show loading message
  chatWindow.innerHTML += `<div><strong>Assistant:</strong> Thinking...</div>`;

  try {
    // Create messages array for OpenAI API
    const messages = [
      {
        role: "system",
        content: "You are a helpful product advisor assistant.",
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    // Send POST request to Cloudflare worker
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 800,
        messages: [
          { role: "user", content: userMessage },
          { role: "system", content: "You are a helpful product advisor assistant who only knows about Loreal products, offering advice on skincare, hair care, facial care, and any other cosmetics Loreal had to offer. You are able to give short descriptions of how to use products and routines." },
        ],
      }),
    });

    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();

    // Check if the response has the expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from API");
    }

    // Get the AI's response from the data
    const aiResponse = data.choices[0].message.content;

    // Display the conversation in the chat window
    chatWindow.innerHTML = `
      <div><strong>You:</strong> ${userMessage}</div>
      <div><strong>Assistant:</strong> ${aiResponse}</div>
    `;
  } catch (error) {
    // Log the full error details for debugging
    console.error("Error connecting to OpenAI API:", error);

    // Show user-friendly error message based on error type
    let errorMessage = "Something went wrong. Please try again.";

    // Check for specific error types and provide helpful messages
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      errorMessage =
        "Unable to connect to the server. Please check your internet connection.";
    } else if (error.message.includes("HTTP error")) {
      errorMessage =
        "The server returned an error. Please try again in a moment.";
    } else if (error.message.includes("Invalid response format")) {
      errorMessage =
        "Received an unexpected response from the API. Please try again.";
    }

    // Display the error message to the user
    chatWindow.innerHTML = `
      <div><strong>You:</strong> ${userMessage}</div>
      <div><strong>Error:</strong> ${errorMessage}</div>
    `;
  }

  // Clear the input field
  userInput.value = "";
});
