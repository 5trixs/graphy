document.addEventListener("DOMContentLoaded", () => {
    const dataTable = document.querySelector("#data-table tbody");
    const addRowBtn = document.getElementById("add-row-btn");
    const graphTypeSelect = document.getElementById("graph-type");
    const generateGraphBtn = document.getElementById("generate-graph-btn");
    const downloadImageBtn = document.getElementById("download-image-btn");
    const downloadGifBtn = document.getElementById("download-gif-btn");
    const chartCanvas = document.getElementById("chartCanvas");
    const animationDurationInput = document.getElementById("animation-duration");
    const animationEasingSelect = document.getElementById("animation-easing");
    let chartInstance = null;

    // Generate random color
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    // Add a new row to the table
    addRowBtn.addEventListener("click", () => {
        const randomColor = getRandomColor();
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="text" placeholder="Label"></td>
            <td><input type="number" placeholder="Value"></td>
            <td><input type="color" value="${randomColor}" class="color-picker"></td>
            <td><button class="delete-row-btn">Delete</button></td>
        `;
        dataTable.appendChild(newRow);

        // Add event listener for delete button
        newRow.querySelector(".delete-row-btn").addEventListener("click", () => {
            newRow.remove();
        });
    });
    
    // Generate graph
    generateGraphBtn.addEventListener("click", () => {
        const labels = [];
        const values = [];
        const colors = [];
        dataTable.querySelectorAll("tr").forEach(row => {
            const label = row.querySelector("td:nth-child(1) input").value;
            const value = row.querySelector("td:nth-child(2) input").value;
            const color = row.querySelector("td:nth-child(3) input").value;
            if (label && value) {
                labels.push(label);
                values.push(parseFloat(value));
                colors.push(color);
            }
        });

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(chartCanvas, {
            type: graphTypeSelect.value,
            data: {
                labels: labels,
                datasets: [{
                    label: "Dataset",
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                animation: {
                    duration: parseInt(animationDurationInput.value),
                    easing: animationEasingSelect.value,
                }
            }
        });
    });

    // Download graph as image
    downloadImageBtn.addEventListener("click", () => {
        const link = document.createElement("a");
        link.href = chartCanvas.toDataURL("image/png");
        link.download = "graph.png";
        link.click();
    });

    // Download graph as animated GIF or MP4
    downloadGifBtn.addEventListener("click", () => {
        if (!chartInstance) {
            alert("Please generate a graph first.");
            return;
        }
    
        try {
            const gif = new GIF({
                workers: 2,
                quality: 10,
                workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js',
            });
    
            const frameCount = 30; // Number of frames for the GIF
            const frameDuration = 100; // Delay per frame in milliseconds
            let currentFrame = 0;
    
            function captureFrame() {
                if (currentFrame >= frameCount) {
                    gif.render();
                    return;
                }
    
                // Ensure the canvas is updated
                chartInstance.options.animation = false;
                chartInstance.update();
                
                // Add the canvas as a frame to the GIF
                gif.addFrame(chartCanvas, { copy: true, delay: frameDuration });
    
                currentFrame++;
                setTimeout(captureFrame, frameDuration);
            }
    
            gif.on("finished", (blob) => {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "graph.gif";
                link.click();
            });
    
            gif.on("error", (error) => {
                console.error("GIF generation failed:", error);
                alert("Failed to generate GIF. Please try again or use the MP4 download.");
            });
    
            // Start capturing frames
            captureFrame();
        } catch (error) {
            console.error("An unexpected error occurred:", error);
            alert("GIF generation is not supported in your browser.");

            // Fallback to MP4
            const stream = chartCanvas.captureStream(30); // 30 FPS
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: "video/mp4" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "graph.mp4";
                link.click();
            };

            recorder.start();
            setTimeout(() => recorder.stop(), 3000); // Record for 3 seconds
        }
    });
});
