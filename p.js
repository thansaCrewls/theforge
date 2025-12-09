// Script untuk scrape server dari games.roblox.com API
// Ini adalah approach paling reliable

console.clear();
console.log('🎮 FORGOTTEN KINGDOM - SERVER SCRAPER (via Roblox API)');
console.log('=====================================\n');

const placeId = '129009554587176';
let allServers = [];
let pageCount = 0;

async function scrapeAllPages() {
  console.log('⏳ Starting to fetch all server pages...\n');
  
  let cursor = '';
  let hasMore = true;
  
  while (hasMore && pageCount < 50) { // Safety limit 50 pages
    pageCount++;
    console.log(`📄 Fetching page ${pageCount}...`);
    
    try {
      const url = `https://games.roblox.com/v1/games/${placeId}/servers/0?sortOrder=Asc&excludeFullGames=false&limit=100&cursor=${cursor}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        console.log(`⚠️  Status ${response.status} on page ${pageCount}`);
        hasMore = false;
        break;
      }
      
      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        console.log(`✅ Page ${pageCount}: No more servers (total: ${allServers.length})`);
        hasMore = false;
        break;
      }
      
      console.log(`✅ Page ${pageCount}: Got ${data.data.length} servers (total: ${allServers.length + data.data.length})`);
      allServers.push(...data.data);
      
      if (!data.nextPageCursor) {
        console.log(`✅ No more pages\n`);
        hasMore = false;
      } else {
        cursor = data.nextPageCursor;
      }
      
      // Delay untuk hindari rate limit
      await new Promise(r => setTimeout(r, 300));
      
    } catch (error) {
      console.error(`❌ Error on page ${pageCount}:`, error.message);
      hasMore = false;
    }
  }
  
  console.log(`\n📊 TOTAL SERVERS FETCHED: ${allServers.length}\n`);
  
  if (allServers.length === 0) {
    console.log('❌ No servers found.');
    console.log('💡 If page shows servers but we got 0:');
    console.log('   - Check if Roblox API is accessible');
    console.log('   - Try opening halaman game di tab baru');
    console.log('   - Use Rovalra extension instead\n');
    return false;
  }
  
  processServers(allServers);
  return true;
}

function processServers(servers) {
  console.log('=====================================\n');
  console.log('🎮 FORGOTTEN KINGDOM - SERVER LIST');
  console.log('=====================================\n');
  
  const serverList = servers.map((server, idx) => ({
    no: idx + 1,
    id: server.id || 'unknown',
    players: server.playing || 0,
    maxPlayers: server.maxPlayers || 16,
    fps: server.fps ? parseFloat(server.fps).toFixed(2) : 'N/A',
    ping: server.ping || 'N/A',
    webLink: `https://www.roblox.com/games/${placeId}?_gameInstanceId=${server.id}`,
    appLink: `roblox://placeID=${placeId}&gameInstanceID=${server.id}`
  }));
  
  // Display first 15
  console.log('Sample servers:\n');
  serverList.slice(0, 15).forEach(s => {
    console.log(`[${s.no}] Players: ${s.players}/${s.maxPlayers} | FPS: ${s.fps} | Ping: ${s.ping}`);
    console.log(`    ID: ${s.id}`);
  });
  
  if (serverList.length > 15) {
    console.log(`\n... and ${serverList.length - 15} more servers\n`);
  }
  
  // Create TXT - HANYA LINK ROBLOX APP
  let txtContent = '';
  serverList.forEach(s => {
    txtContent += s.appLink + '\n';
  });
  
  window.serverResults = { serverList, txtContent };
  
  // Summary
  console.log('📈 SUMMARY:');
  console.log(`Total Servers: ${serverList.length}`);
  console.log(`Total Players Online: ${serverList.reduce((s, x) => s + x.players, 0)}`);
  const avgPlayers = serverList.reduce((s, x) => s + x.players, 0) / serverList.length;
  console.log(`Average Players/Server: ${avgPlayers.toFixed(1)}`);
  const validFps = serverList.filter(s => s.fps !== 'N/A');
  if (validFps.length > 0) {
    const avgFps = validFps.reduce((s, x) => s + parseFloat(x.fps), 0) / validFps.length;
    console.log(`Average FPS: ${avgFps.toFixed(1)}`);
  }
  
  console.log('\n💾 EXPORT:');
  console.log('downloadFile("txt") - Text file');
  console.log('downloadFile("json") - JSON format');
  console.log('downloadFile("csv") - Excel/Spreadsheet');
}

window.downloadFile = (format = 'txt') => {
  if (!window.serverResults) {
    console.log('❌ No data. Run scrapeAllPages() first');
    return;
  }

  let content = '';
  let filename = `forgotten-kingdom-servers`;

  if (format === 'txt') {
    content = window.serverResults.txtContent;
    filename += '.txt';
  } else if (format === 'json') {
    content = JSON.stringify(window.serverResults.serverList, null, 2);
    filename += '.json';
  } else if (format === 'csv') {
    let csv = 'No,Players,Max,FPS,Ping,ServerID,AppLink,WebLink\n';
    window.serverResults.serverList.forEach(s => {
      csv += `${s.no},${s.players},${s.maxPlayers},"${s.fps}","${s.ping}","${s.id}","${s.appLink}","${s.webLink}"\n`;
    });
    content = csv;
    filename += '.csv';
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`✅ Downloaded: ${filename}`);
};

window.openServerWithConfirm = (appLink) => {
  window.location.href = appLink;
  
  // Auto-click tombol "Open Roblox Game Client" setelah delay
  setTimeout(() => {
    const buttons = document.querySelectorAll('button');
    const openBtn = Array.from(buttons).find(btn => 
      btn.textContent.includes('Open Roblox Game Client') || 
      btn.textContent.includes('Open')
    );
    
    if (openBtn) {
      console.log('🤖 Auto-clicking Open button...');
      openBtn.click();
    }
  }, 500);
};

window.openAllServers = () => {
  if (!window.serverResults) {
    console.log('❌ No data available');
    return;
  }
  
  const total = window.serverResults.serverList.length;
  console.log(`🚀 Opening ${total} server links via Roblox app...\n`);
  console.log('⚠️  Make sure to click "Open Roblox Game Client" for each one\n');
  
  let opened = 0;
  let delay = 0;
  
  window.serverResults.serverList.forEach((server, idx) => {
    setTimeout(() => {
      window.openServerWithConfirm(server.appLink);
      opened++;
      console.log(`✅ Opened ${opened}/${total} - Click confirm dialog if appears`);
    }, delay);
    delay += 3000; // 3 detik delay
  });
  
  console.log(`\n⏳ Will open all ${total} servers over next ${(delay / 1000).toFixed(1)} seconds`);
};

window.openRandomServer = () => {
  if (!window.serverResults) {
    console.log('❌ No data available');
    return;
  }
  
  const random = window.serverResults.serverList[Math.floor(Math.random() * window.serverResults.serverList.length)];
  console.log(`🎮 Opening random server: ${random.id}`);
  console.log('💡 Click "Open Roblox Game Client" button when prompted');
  window.openServerWithConfirm(random.appLink);
};

// Start scraping
scrapeAllPages();
