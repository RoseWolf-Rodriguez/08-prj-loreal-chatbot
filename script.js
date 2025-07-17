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
      }),
    });

    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();

    // Get the AI's response from the data
    const aiResponse = data.choices[0].message.content;

    // Display the conversation in the chat window
    chatWindow.innerHTML = `
      <div><strong>You:</strong> ${userMessage}</div>
      <div><strong>Assistant:</strong> ${aiResponse}</div>
    `;
  } catch (error) {
    // Handle any errors that occur during the API call
    console.error("Error connecting to OpenAI API:", error);
    chatWindow.innerHTML += `<div><strong>Error:</strong> Failed to connect to the API. Please try again.</div>`;
  }

  // Clear the input field
  userInput.value = "";
});
