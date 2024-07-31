document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadContent(new Event('load'), 'kpis.html');
});

// Function to initialize the page
function initializePage() {
    initializeFileUploads();
    initializeFlatpickr();
}

// Function to handle file uploads
function initializeFileUploads() {
    const fileInputs = document.querySelectorAll('#file-input, #file-input-annual, #file-input-consumer');
    const imageDisplays = document.querySelectorAll('#image-display, #image-display-annual, #image-display-consumer');
    const uploadedImages = document.querySelectorAll('#uploaded-image, #uploaded-image-annual, #uploaded-image-consumer');
    const lightboxes = document.querySelectorAll('#lightbox, #lightbox-annual, #lightbox-consumer');
    const lightboxImgs = document.querySelectorAll('#lightbox-img, #lightbox-img-annual, #lightbox-img-consumer');
    const deleteButtons = document.querySelectorAll('.delete-button');
    const fileLabels = document.querySelectorAll('.file-label');

    fileInputs.forEach((fileInput, index) => {
        const imageDisplay = imageDisplays[index];
        const uploadedImage = uploadedImages[index];
        const lightbox = lightboxes[index];
        const lightboxImg = lightboxImgs[index];
        const deleteButton = deleteButtons[index];
        const fileLabel = fileLabels[index];

        if (fileInput && imageDisplay && uploadedImage && lightbox && lightboxImg && deleteButton && fileLabel) {
            fileInput.addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        uploadedImage.src = e.target.result;
                        imageDisplay.style.display = 'flex';
                        fileLabel.style.display = 'none';
                        deleteButton.style.display = 'flex';
                    };
                    reader.readAsDataURL(file);
                }
            });

            uploadedImage.addEventListener('click', function() {
                lightboxImg.src = uploadedImage.src;
                lightbox.style.display = 'flex';
            });

            lightbox.addEventListener('click', function(e) {
                if (e.target !== lightboxImg) {
                    lightbox.style.display = 'none';
                }
            });

            deleteButton.addEventListener('click', function() {
                uploadedImage.src = '#';
                imageDisplay.style.display = 'none';
                fileLabel.style.display = 'flex';
                deleteButton.style.display = 'none';
                fileInput.value = ''; // Reset the file input
            });
        }
    });
}

// Function to allow dropping elements
function allowDrop(event) {
    event.preventDefault();
}

// Function to handle drag event
function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

// Function to handle drop event
function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    const fileItem = document.getElementById(data);
    const fileList = event.target.closest('.folder').querySelector('.file-list');
    fileList.appendChild(fileItem);
    fileList.classList.remove('empty');

    // Check if "Uncategorized" is now empty
    const uncategorizedFiles = document.getElementById('uncategorized-files');
    if (uncategorizedFiles.children.length === 0) {
        uncategorizedFiles.classList.add('empty');
    }
}

// Function to toggle folder expansion
function toggleFolder(folderId) {
    const folder = document.getElementById(folderId);
    folder.classList.toggle('expanded');
    if (folder.children.length === 0) {
        folder.classList.add('empty');
    } else {
        folder.classList.remove('empty');
    }
}

// Function to initialize Flatpickr
function initializeFlatpickr() {
    document.querySelectorAll(".date-cell").forEach(cell => {
        flatpickr(cell, {
            dateFormat: "m/d/y",
            allowInput: true,
            clickOpens: true,
            onChange: function(selectedDates, dateStr, instance) {
                cell.innerText = dateStr;
            }
        });
    });
}

// Function to add a new week column to the KPI table
function addWeekColumn() {
    const table = document.getElementById('kpi-table');
    const headerRow = table.rows[0];

    // Insert new header cell after 'Goal' column
    const newHeaderCell = headerRow.insertCell(2);
    newHeaderCell.outerHTML = `<th class="date-cell">MM/DD/YY</th>`;

    // Add a new editable cell to each row for the new week
    for (let i = 1; i < table.rows.length; i++) {
        const newRowCell = table.rows[i].insertCell(2);
        newRowCell.contentEditable = "true";
        newRowCell.innerText = ""; // Ensure the new cell is blank
    }

    updateTableWidth();
    initializeFlatpickr();
}

// Function to update table width and add scroll bar if necessary
function updateTableWidth() {
    const tableContainer = document.querySelector('.kpi-table-container');
    tableContainer.style.overflowX = 'auto';
    tableContainer.scrollLeft = tableContainer.scrollWidth; // Scroll to the end when a new column is added
}

// Function to add a new KPI row to the table
function addKpiRow() {
    const table = document.getElementById('kpi-table');
    const newRow = table.insertRow();

    const nameCell = newRow.insertCell(0);
    nameCell.contentEditable = "true";
    nameCell.innerText = "New KPI";

    const goalCell = newRow.insertCell(1);
    goalCell.contentEditable = "true";
    goalCell.innerText = "Goal";

    for (let i = 2; i < table.rows[0].cells.length; i++) {
        const newCell = newRow.insertCell(i);
        newCell.contentEditable = "true";
        newCell.innerText = "";
    }

    updateTableWidth();
    initializeFlatpickr();
}

// Function to load content dynamically
function loadContent(event, page) {
    event.preventDefault();
    console.log(`Loading content from ${page}`);
    
    fetch(page)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.text();
        })
        .then(data => {
            console.log(`Content loaded from ${page}`);
            document.getElementById('main-content').innerHTML = data;
            initializePage(); // Initialize the newly loaded content
        })
        .catch(error => {
            console.error('Error loading the page:', error);
        });
}

// Growth Calculator functions
function updateRangeValue(value) {
    document.getElementById('rangeValue').innerText = parseFloat(value).toFixed(2) + '%';
}

function updateOrganicValue(value) {
    document.getElementById('organicValue').innerText = value + '%';
}

function updateAdsConversionValue(value) {
    document.getElementById('adsConversionValue').innerText = parseFloat(value).toFixed(2) + '%';
}

function toggleMetrics() {
    const metrics = document.getElementById('marketingMetrics');
    const subtext = document.getElementById('metricsSubtext');
    const icon = document.querySelector('.toggle-icon');
    if (metrics.style.display === 'none' || metrics.style.display === '') {
        metrics.style.display = 'flex';
        subtext.style.display = 'block';
        icon.textContent = '-';
    } else {
        metrics.style.display = 'none';
        subtext.style.display = 'none';
        icon.textContent = '+';
    }
}

function calculatePageViews() {
    let revenueGoal = parseFloat(document.getElementById('revenueGoal').value.replace(/[^\d.-]/g, ''));
    let aov = parseFloat(document.getElementById('aov').value.replace(/[^\d.-]/g, ''));
    const conversionRate = parseFloat(document.getElementById('conversionRate').value) / 100;
    const organicRate = parseFloat(document.getElementById('organicRate').value) / 100;
    const adsConversionRate = parseFloat(document.getElementById('adsConversionRate').value) / 100;
    let cpc = parseFloat(document.getElementById('cpc').value);

    if (isNaN(revenueGoal)) {
        revenueGoal = 1000000; 
    }
    if (isNaN(aov)) {
        aov = 50; 
    }
    if (isNaN(cpc)) {
        cpc = 1.00; 
    }

    const requiredPageViewsAnnually = revenueGoal / (aov * conversionRate);
    const requiredPageViewsDaily = requiredPageViewsAnnually / 365;
    const requiredPageViewsWeekly = requiredPageViewsAnnually / 52;
    const requiredPageViewsMonthly = requiredPageViewsAnnually / 12;

    const nonOrganicRate = 1 - organicRate;
    const requiredNonOrganicPageViewsAnnually = revenueGoal / (aov * adsConversionRate) * nonOrganicRate;
    const requiredNonOrganicPageViewsDaily = requiredNonOrganicPageViewsAnnually / 365;
    const requiredNonOrganicPageViewsWeekly = requiredNonOrganicPageViewsAnnually / 52;
    const requiredNonOrganicPageViewsMonthly = requiredNonOrganicPageViewsAnnually / 12;

    const adSpendAnnually = requiredNonOrganicPageViewsAnnually * cpc;
    const adSpendDaily = adSpendAnnually / 365;
    const adSpendWeekly = adSpendAnnually / 52;
    const adSpendMonthly = adSpendAnnually / 12;

    const resultsElement = document.getElementById('results');
    resultsElement.style.display = 'block';
    resultsElement.innerHTML = `
        <p>To achieve an annual revenue goal of <strong>$${revenueGoal.toLocaleString()}</strong>, with an average order value of <strong>$${aov.toLocaleString()}</strong> and a conversion rate of <strong>${parseFloat(conversionRate * 100).toFixed(2)}%</strong>, you need approximately:</p>
        <ul>
            <li><strong>${Math.round(requiredPageViewsDaily).toLocaleString()}</strong> page views daily</li>
            <li><strong>${Math.round(requiredPageViewsWeekly).toLocaleString()}</strong> page views weekly</li>
            <li><strong>${Math.round(requiredPageViewsMonthly).toLocaleString()}</strong> page views monthly</li>
            <li><strong>${Math.round(requiredPageViewsAnnually).toLocaleString()}</strong> page views annually</li>
        </ul>
        <p>Based on <strong>${(organicRate * 100).toFixed(2)}%</strong> organic page views, an estimated CPC of <strong>$${cpc.toFixed(2)}</strong>, and an ads conversion rate of <strong>${(adsConversionRate * 100).toFixed(2)}%</strong>, to hit your revenue goal of <strong>$${revenueGoal.toLocaleString()}</strong>, your ad spend will be approximately:</p>
        <ul>
            <li><strong>$${adSpendDaily.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> daily to generate <strong>${Math.round(requiredNonOrganicPageViewsDaily).toLocaleString()}</strong> paid page visits</li>
            <li><strong>$${adSpendWeekly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> weekly to generate <strong>${Math.round(requiredNonOrganicPageViewsWeekly).toLocaleString()}</strong> paid page visits</li>
            <li><strong>$${adSpendMonthly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> monthly to generate <strong>${Math.round(requiredNonOrganicPageViewsMonthly).toLocaleString()}</strong> paid page visits</li>
            <li><strong>$${adSpendAnnually.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> annually to generate <strong>${Math.round(requiredNonOrganicPageViewsAnnually).toLocaleString()}</strong> paid page visits</li>
        </ul>`;
}

function formatCurrency(input) {
    let value = input.value.replace(/[^\d.-]/g, '');

    if (!isNaN(value) && value !== '') {
        input.value = '$' + parseFloat(value).toLocaleString();
    } else {
        input.value = '';
    }
}

// Function to show the modal
function showAddTaskModal() {
    console.log('Showing Add Task Modal');
    document.getElementById('add-task-modal').style.display = 'flex';
    document.body.classList.add('modal-open');
}

// Function to hide the modal
function hideAddTaskModal() {
    console.log('Hiding Add Task Modal');
    document.getElementById('add-task-modal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Function to handle adding a task when Enter key is pressed
function handleAddTask(event) {
    if (event.key === 'Enter') {
        console.log('Enter key pressed');
        const taskText = document.getElementById('new-task-input').value;
        if (taskText.trim() !== '') {
            addTask(taskText);
            document.getElementById('new-task-input').value = '';
            hideAddTaskModal();
        }
    }
}

// Function to add a new task to the active tasks list
function addTask(taskText) {
    console.log('Adding Task:', taskText);
    const taskList = document.getElementById('active-task-list');
    const taskItem = document.createElement('li');
    taskItem.className = 'task-item';
    taskItem.draggable = true;
    taskItem.id = `task-${new Date().getTime()}`; // unique id
    taskItem.ondragstart = drag;
    taskItem.innerHTML = `
        <span>${taskText}</span>
        <div class="task-actions">
            <button class="on-hold-btn" onclick="moveToOnHold(this)"><i class="fas fa-hand-paper"></i></button>
            <button class="done-btn" onclick="markAsCompleted(this)"><i class="fas fa-check"></i></button>
            <button class="delete-task-btn" onclick="deleteTask(this)"><i class="fas fa-times"></i></button>
        </div>
    `;
    taskList.appendChild(taskItem);
}

// Function to delete a task
function deleteTask(button) {
    const taskItem = button.parentElement.parentElement;
    taskItem.remove();
}

// Function to move a task to the on-hold list
function moveToOnHold(button) {
    const taskItem = button.parentElement.parentElement;
    document.getElementById('onhold-task-list').appendChild(taskItem);
}

// Function to mark a task as completed
function markAsCompleted(button) {
    const taskItem = button.parentElement.parentElement;
    taskItem.classList.add('completed');
    document.getElementById('completed-task-list').appendChild(taskItem);
    console.log('Task marked as completed, launching confetti...');
    launchConfetti();
}

// Function to launch confetti explosion
function launchConfetti() {
    console.log('Launching confetti...');
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

// Function to allow dropping elements
function allowDrop(event) {
    event.preventDefault();
}

// Function to handle drag event
function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

// Function to handle drop event
function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    const taskItem = document.getElementById(data);
    if (event.target.tagName === 'UL') {
        event.target.appendChild(taskItem);
    } else if (event.target.closest('.task-bucket')) {
        event.target.closest('.task-bucket').querySelector('.task-list').appendChild(taskItem);
    }
}

// Add event listener for document to handle modal close on outside click
document.addEventListener('click', function(event) {
    const modal = document.getElementById('add-task-modal');
    if (event.target === modal) {
        hideAddTaskModal();
    }
});

// Timer and goal management
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('quarterly-goals.html')) {
        initializeQuarterlyGoalsPage();
    }
});

function initializeQuarterlyGoalsPage() {
    startCountdown();
    document.getElementById('new-goal-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            addGoal(event.target.value);
            event.target.value = '';
        }
    });
}

function startCountdown() {
    const countdownTimer = document.getElementById('countdown-timer');
    const countdownText = document.getElementById('countdown-text');

    function updateCountdown() {
        const now = new Date();
        const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
        const nextQuarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
        if (nextQuarterStart <= now) {
            nextQuarterStart.setFullYear(nextQuarterStart.getFullYear() + 1);
        }

        const diff = nextQuarterStart - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownTimer.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        countdownText.textContent = `Until the end of Q${currentQuarter}`;

        setTimeout(updateCountdown, 1000);
    }

    updateCountdown();
}

function addGoal(goalText) {
    if (goalText.trim() !== '') {
        const goalList = document.getElementById('goal-list');
        const goalItem = document.createElement('li');
        goalItem.textContent = goalText;
        goalList.appendChild(goalItem);
    }
}
