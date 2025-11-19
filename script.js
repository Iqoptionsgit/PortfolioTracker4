// script.js
// Configuration
const C3MWN5VX314YSB2JUSNQSX9CBNG1MJ1BP6 = 'YOUR_ETHERSCAN_KEY'; // Replace with your free Etherscan API key
const ASSETS = [
    { name: 'ETH', id: 'ethereum', contract: '', decimals: 18 }, // Native ETH
    { name: 'USDC', id: 'usd-coin', contract: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 } // Sepolia USDC contract
];
let historicalData = []; // For performance chart

// Auto-update every 4 hours (14400000 ms)
setInterval(updatePortfolio, 14400000);

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('investorName');
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedName) document.getElementById('investorName').value = savedName;
    if (savedAddress) document.getElementById('walletAddress').value = savedAddress;
    if (savedAddress) updatePortfolio(); // Auto-update if address saved
});

// Main function to update portfolio
async function updatePortfolio() {
    const name = document.getElementById('investorName').value.trim();
    const address = document.getElementById('walletAddress').value.trim();
    
    if (!address) {
        alert('Please enter a wallet address.');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('investorName', name);
    localStorage.setItem('walletAddress', address);
    
    document.getElementById('nameDisplay').textContent = name || 'Investor';
    document.getElementById('portfolioDisplay').classList.remove('hidden');
    
    let totalValue = 0;
    const tbody = document.querySelector('#portfolioTable tbody');
    tbody.innerHTML = ''; // Clear table
    
    for (const asset of ASSETS) {
        try {
            // Fetch balance from Etherscan (Sepolia)
            let balance = 0;
            if (asset.contract === '') {
                // Native ETH
                const url = `https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
                const response = await fetch(url);
                const data = await response.json();
                balance = parseFloat(data.result) / Math.pow(10, asset.decimals);
            } else {
                // Token balance
                const url = `https://api-sepolia.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${asset.contract}&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
                const response = await fetch(url);
                const data = await response.json();
                balance = parseFloat(data.result) / Math.pow(10, asset.decimals);
            }
            
            // Fetch price from CoinGecko
            const priceUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${asset.id}&vs_currencies=usd`;
            const priceResponse = await fetch(priceUrl);
            const priceData = await priceResponse.json();
            const price = priceData[asset.id]?.usd || 0;
            
            const value = balance * price;
            totalValue += value;
            
            // Add row to table
            const row = tbody.insertRow();
            row.insertCell(0).textContent = asset.name;
            row.insertCell(1).textContent = balance.toFixed(4);
            row.insertCell(2).textContent = price ? `$${price.toFixed(2)}` : '$0.00';
            row.insertCell(3).textContent = value ? `$${value.toFixed(2)}` : '$0.00';
            row.insertCell(4).textContent = totalValue > 0 ? ((value / totalValue) * 100).toFixed(2) + '%' : '0%';
        } catch (error) {
            console.error(`Error fetching ${asset.name}:`, error);
        }
    }
    
    // Update total and timestamp
    document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
    
    // Add to historical data (for performance chart)
    historicalData.push({ date: new Date().toLocaleDateString(), value: totalValue });
    if (historicalData.length > 20) historicalData.shift(); // Keep last 20 updates
    
    // Render charts
    renderCharts(totalValue);
}

// Render charts using Chart.js
function renderCharts(totalValue) {
    const assetValues = ASSETS.map(asset => {
        // Simplified: Use mock or from table; in full, extract from DOM
        return Math.random() * totalValue / ASSETS.length; // Placeholder; replace with real values
    });
    
    // Pie Chart: Allocation
    const ctxPie = document.getElementById('allocationChart').getContext('2d');
    new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: ASSETS.map(a => a.name),
            datasets: [{ data: assetValues, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Portfolio Allocation' } } }
    });
    
    // Line Chart: Performance
    const ctxLine = document.getElementById('performanceChart').getContext('2d');
    new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: historicalData.map(d => d.date),
            datasets: [{ label: 'Total Value ($)', data: historicalData.map(d => d.value), borderColor: '#007BFF', fill: false }]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Performance Over Time' } } }
    });
}
