document.addEventListener("DOMContentLoaded", function () {
    const tabList = document.getElementById("tab-list");
    const tabCount = document.getElementById("tab-count");
    const closeSelectedBtn = document.getElementById("close-selected-btn");
    const checkAllCheckbox = document.getElementById("check-all");
    const downloadBtn = document.getElementById("download-btn");

    let tabs = [];

    // Function to fetch and populate the list of tabs that will be closed
    function populateTabList() {
        chrome.runtime.sendMessage({ action: "getTabsToClose" }, function (response) {
            tabs = response.tabs;
            tabCount.textContent = `${tabs.length} tab(s)`;
            tabList.innerHTML = ""; // Clear existing tabs

            // Populate the list of tabs
            tabs.forEach((tab, index) => {
                let li = document.createElement("li");
                li.innerHTML = `
                    <label>
                        <input type="checkbox" id="tab-${index}" checked />
                        <strong>${tab.title}</strong><br />
                        <small>${tab.url}</small>
                    </label>
                `;
                tabList.appendChild(li);

                // Add event listener for checkbox changes
                const checkbox = document.getElementById(`tab-${index}`);
                checkbox.addEventListener("change", updateTabCount);
            });
        });
    }

    // Function to update the count of selected tabs
    function updateTabCount() {
        const checkboxes = tabList.querySelectorAll("input[type='checkbox']");
        const selectedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
        tabCount.textContent = `${selectedCount} tab(s)`;
    }

    // Initial population of the tab list
    populateTabList();

    // Handle the check/uncheck all functionality
    checkAllCheckbox.addEventListener("change", function () {
        const checkboxes = tabList.querySelectorAll("input[type='checkbox']");
        checkboxes.forEach((checkbox) => {
            checkbox.checked = checkAllCheckbox.checked;
        });
        updateTabCount();  // Update count when all are checked/unchecked
    });

    // Handle the close button click
    closeSelectedBtn.addEventListener("click", function () {
        let selectedTabIds = [];

        chrome.runtime.sendMessage({ action: "getTabsToClose" }, function (response) {
            let tabs = response.tabs;

            // Check which tabs are selected to be closed
            tabs.forEach((tab, index) => {
                let checkbox = document.getElementById(`tab-${index}`);
                if (checkbox.checked) {
                    selectedTabIds.push(tab.id);
                }
            });

            // Send the list of tabs to close to the background script
            chrome.runtime.sendMessage({ action: "closeSelectedTabs", tabIds: selectedTabIds }, function () {
                // Refresh the tab list after closing
                populateTabList();
            });
        });
    });

    // Handle the download button click
    downloadBtn.addEventListener("click", function () {
        let tabListText = tabs.map(tab => `${tab.url} - ${tab.title}\n`).join("\n");

        // Create a blob with the tab list content
        let blob = new Blob([tabListText], { type: 'text/plain' });

        // Create a link element and trigger the download
        let link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'tabs_list.txt';

        // Append the link, trigger click, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
