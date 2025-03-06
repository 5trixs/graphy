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

        newRow.querySelector(".delete-row-btn").addEventListener("click", () => {
            newRow.remove();
        });
    });

    // Function to get data from table
    function getTableData() {
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
        return { labels, values, colors };
    }

    // Generate graph
    generateGraphBtn.addEventListener("click", () => {
        const { labels, values, colors } = getTableData();
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
        if (!chartInstance) {
            alert("Please generate a graph first.");
            return;
        }
        const link = document.createElement("a");
        link.href = chartCanvas.toDataURL("image/png");
        link.download = "graph.png";
        link.click();
    });


// Download graph as GIF
downloadGifBtn.addEventListener("click", async () => {
    if (!chartInstance) {
        alert("Please generate a graph first.");
        return;
    }

    const { labels, values, colors } = getTableData();
    const animationDuration = parseInt(animationDurationInput.value) || 1000;
    const frameInterval = 33; // ~30 FPS

    if (chartInstance) {
        chartInstance.destroy();
    }

    // Fetch worker script and create blob URL
    const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
    const script = await response.text();
    const blob = new Blob([script], { type: 'application/javascript' });
    const workerBlobUrl = URL.createObjectURL(blob);

    const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: workerBlobUrl
    });

    let captureInterval;

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
                duration: animationDuration,
                easing: animationEasingSelect.value,
                onComplete: () => {
                    clearInterval(captureInterval);
                    gif.render();
                }
            }
        }
    });

    // Set willReadFrequently to optimize canvas readbacks
    chartCanvas.getContext('2d').willReadFrequently = true;

    // Capture frames
    captureInterval = setInterval(() => {
        gif.addFrame(chartCanvas, { copy: true, delay: frameInterval });
    }, frameInterval);

    gif.on("finished", (blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "graph.gif";
        link.click();
    });

    gif.on("error", (error) => {
        console.error("GIF generation failed:", error);
        alert("Failed to generate GIF.");
    });
});
});
