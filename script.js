import {model} from "./mainmodule.js";

window.onload = function() {
    var audio = document.getElementById('audioPlayer');
    // Audio is muted and plays automatically
};

let x = 0;
let y = 0;
let targetX = 0;
let targetY = 0;
let time = 0; // A time variable to create periodic motion

document.addEventListener('mousemove', function(e) {
    targetX = e.clientX / window.innerWidth;
    targetY = e.clientY / window.innerHeight;
});

// This function will animate the movement
function animate() {
    // Add a subtle continuous motion to targetX and targetY
    time += 0.01; // Increment time for smooth motion
    const noiseX = Math.sin(time) * 0.15; // Small periodic motion for X
    const noiseY = Math.cos(time) * 0.15; // Small periodic motion for Y

    // Combine mouse movement with continuous motion
    const finalTargetX = targetX + noiseX;
    const finalTargetY = targetY + noiseY;

    // Smoothly transition to the new target position
    x += (finalTargetX - x) * 0.1; // Interpolation factor (controls speed)
    y += (finalTargetY - y) * 0.1;

    // Apply the parallax effect
    const layers = document.querySelectorAll('#parallax-container img, #parallax-container #steve');
    
    layers.forEach((layer, index) => {
        const movement = (index + 1) * 10; // Control speed based on layer
        const offsetX = (x - 0) * movement; // Center around 0.5
        const offsetY = (y - 1) * movement; // Center around 0.5

        // Apply transform for parallax effect
        layer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });

    // Request the next frame to keep animating
    requestAnimationFrame(animate);
}

// Start the animation loop
animate();


// document.addEventListener('wheel', function(e) {
//     e.preventDefault();
// }, { passive: false });

const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chatbot-container");
const chatBox = document.querySelector(".chat");

const audio = document.getElementById('audioPlayer');
const steveButton = document.querySelector("#steve-button");
const stoneClicked = new Audio("sounds/Stone_button_press.ogg");
const stoneUnclicked = new Audio("sounds/Stone_button_unpress.ogg");

console.log(steveButton);

const getChatResponse = async () => {
    const message = chatInput.value;
    // Sanity check: Log the user input
    console.log("User Typed:", message);
    const pEle = document.createElement("div");

    audio.muted = false;  // Unmute the audio
    audio.play();  // Ensure it continues playing after unmuting
    sendButton.disabled = true; // Disable the send button at the start
    chatInput.disabled = true;
    chatInput.placeholder = 'Steve is... "thinking"';
    stoneClicked.play();

    // Change the image src to "steve-on.png"
    steveButton.src = "images/steve-on.png";

    // After a delay, change the image back to "steve-off.png"
    setTimeout(() => {
        steveButton.src = "images/steve-off.png";
        stoneUnclicked.play();
    }, 1500); // 2 seconds delay before switching back to off

    try {
        const result = await model.generateContent(message);
        console.log("result: ", result);
        const response = await result.response.text();
        console.log("Response: ", response);

        function splitParagraph(paragraph) {
            let parentheticalSentences = [];
            paragraph = paragraph.replace(/\(([^)]+)\)/g, (match, p1) => {
                let sentences = p1.match(/[^.!?]+(?:\.\.\.|[.!?])+/g) || [p1];
                sentences.forEach(sentence => parentheticalSentences.push(`**${sentence.trim()}`));
                return ''; 
            });
        
            let sentences = paragraph.match(/[^.!?]+(?:\.\.\.|[.!?])+/g) || [paragraph];
            let result = [];
        
            if (sentences.length > 0) {
                result.push(sentences.shift().trim());
            }
        
            while (sentences.length > 0) {
                let chunkSize = Math.min(sentences.length, Math.floor(Math.random() * 3) + 1);
                result.push(sentences.splice(0, chunkSize).join(' ').trim());
            }
        
            result = parentheticalSentences.concat(result);
            return result.filter(sentence => sentence.length > 0);
        }

        const sentences = splitParagraph(response);
        console.log("Sentences: ", sentences);

        function typeSentence(subSentence, paragraph) {
            return new Promise(resolve => {
                let charIndex = 0;
                const isSpecial = subSentence.startsWith("**");
                if (isSpecial) {
                    subSentence = subSentence.substring(2).trim();
                }

                const span = document.createElement('span');
                if (isSpecial) {
                    span.style.opacity = "0.7";
                }
                span.textContent = "";  
                paragraph.appendChild(span);  

                const typingInterval = setInterval(() => {
                    chatBox.scrollTo({
                        top: chatContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                    span.textContent += subSentence[charIndex];
                    charIndex++;
                    if (charIndex === subSentence.length) {
                        clearInterval(typingInterval);
                        resolve();
                    }
                }, 35);
            });
        }

        function pause() {
            const randomPause = Math.floor(Math.random() * (1000 - 700 + 1)) + 700;
            return new Promise(resolve => setTimeout(resolve, randomPause));
        }

        async function handleTypingEffect() {
            for (let sentence of sentences) {
                const subSentences = sentence.match(/[^.!?]+(?:[.!?]+)?/g) || [sentence];

                const bubble = document.createElement('div');
                bubble.classList.add("chat-body-inner");

                const paragraph = document.createElement('span');
                paragraph.classList.add('m-2');

                if (!sentence.startsWith("**")) {
                    bubble.innerHTML = `<span class="steve-text">&lt;Steve&gt;</span>`; 
                }

                bubble.appendChild(paragraph);
                pEle.appendChild(bubble);

                for (let subSentence of subSentences) {
                    await typeSentence(subSentence, paragraph);
                    await pause();
                }
            }
            
            sendButton.disabled = false; // Re-enable the send button after typing
            chatInput.disabled = false;
            chatInput.focus();
            chatInput.placeholder = "Type your message...";
        }

        handleTypingEffect();
        
    } catch (error) {
        pEle.classList.add("gemini-response");
        console.log("Error fetching gemini response: ", error);
        pEle.innerHTML = `
        <div class="chat-body-inner text-left p-5">
            <p>Oops! Something went wrong.</p>
        </div>`;
    }

    chatContainer.appendChild(pEle);
};


const handleAPI = () => {
    const userText = chatInput.value.trim();
    if(!userText) return;
    getChatResponse();
    chatInput.value = '';

    const chatBubbble = document.createElement("div");
    chatBubbble.classList.add("chat-bubble");
    chatBubbble.innerHTML = `
        <div class="chat-body-inner text-right p-5">
            <p>${userText}</p>
        </div>
    `;
    chatContainer.appendChild(chatBubbble);
    chatBox.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });
}

sendButton.addEventListener("click", handleAPI);

chatInput.addEventListener("keydown", (e) =>{
    if(e.key == "Enter") {
        handleAPI();
    }
})

