/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const workerUrl = "https://test.lteretto.workers.dev/";

// Store the conversation history for context
const messages = [
  {
    role: "system",
    content:
      "You are a helpful product advisor assistant who only knows about Loreal products, offering advice on skincare, hair care, facial care, and any other cosmetics Loreal has to offer. You are able to give short descriptions of how to use products and routines.",
  },
];

// Optionally track the user's name if provided
let userName = null;

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's message from the input field
  const userMessage = userInput.value.trim();

  // Don't send empty messages
  if (!userMessage) return;

  // Add user's message to the conversation history
  messages.push({
    role: "user",
    content: userMessage,
  });

  // Try to extract the user's name if they introduce themselves
  // e.g., "My name is Alice" or "I'm Bob"
  if (!userName) {
    const nameMatch = userMessage.match(
      /(?:my name is|i'm|i am)\s+([a-zA-Z]+)/i
    );
    if (nameMatch) {
      userName = nameMatch[1];
      // Optionally, add a system message to inform the assistant of the user's name
      messages.push({
        role: "system",
        content: `The user's name is ${userName}.`,
      });
    }
  }

  // Show user's latest question above the assistant's response using message bubbles
  chatWindow.innerHTML = `
    <div class="msg user"><strong>You:</strong> ${userMessage}</div>
    <div class="msg ai"><strong>Assistant:</strong> Thinking...</div>
  `;

  try {
    // Send POST request to Cloudflare worker with the full conversation history
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

    // Add assistant's reply to the conversation history
    messages.push({
      role: "assistant",
      content: aiResponse,
    });

    // Display the user's latest question above the assistant's response using message bubbles
    chatWindow.innerHTML = `
      <div class="msg user"><strong>You:</strong> ${userMessage}</div>
      <div class="msg ai"><strong>Assistant:</strong> ${aiResponse}</div>
    `;
  } catch (error) {
    // Log the full error details for debugging
    console.error("Error connecting to OpenAI API:", error);

    // Show user-friendly error message based on error type
    let errorMessage = "Something went wrong. Please try again.";

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

    chatWindow.innerHTML = `
      <div class="msg user"><strong>You:</strong> ${userMessage}</div>
      <div class="msg ai"><strong>Error:</strong> ${errorMessage}</div>
    `;
  }

  // Clear the input field
  userInput.value = "";
});
