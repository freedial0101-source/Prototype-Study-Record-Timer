
    // --- 状態管理オブジェクト ---
    let currentStatus = {
        startTime: null,
        stopTime: null
    };
    let tickerInterval = null;
    let tickerTimeout = null;

    // --- DOM要素取得 ---
    const startBtn = document.getElementById('startBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const stopBtn = document.getElementById('stopBtn');
    const ticker = document.getElementById('ticker');
    const startTimeDisp = document.getElementById('startTimeDisp');
    const stopTimeDisp = document.getElementById('stopTimeDisp');
    const memoInput = document.getElementById('memoInput');
    const saveBtn = document.getElementById('saveBtn');
    const datePicker = document.getElementById('datePicker');
    const totalRecordBtn = document.getElementById('totalRecordBtn');
    const clearViewBtn = document.getElementById('clearViewBtn');
    const displayArea = document.getElementById('displayArea');

    // --- 初期化処理 ---
    window.addEventListener('load', () => {
        // 現在の状況を復元
        const savedStatus = localStorage.getItem('timer_current_status');
        if (savedStatus) {
            currentStatus = JSON.parse(savedStatus);
            if (currentStatus.startTime) {
                startTimeDisp.textContent = formatTime(new Date(currentStatus.startTime));
            }
            if (currentStatus.stopTime) {
                stopTimeDisp.textContent = formatTime(new Date(currentStatus.stopTime));
            }
        }
        // メモの復元
        const savedMemo = localStorage.getItem('timer_current_memo');
        if (savedMemo) {
            memoInput.value = savedMemo;
        }
    });

    // メモ欄のリアルタイム保存
    memoInput.addEventListener('input', () => {
        localStorage.setItem('timer_current_memo', memoInput.value);
    });

    // --- 共通ヘルパー関数 ---
    function formatTime(date) {
        return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function calculateDuration(startIso, stopIso) {
        const diffMs = new Date(stopIso) - new Date(startIso);
        if (diffMs < 0) return "0秒";
        const diffSec = Math.floor(diffMs / 1000);
        const h = Math.floor(diffSec / 3600);
        const m = Math.floor((diffSec % 3600) / 60);
        const s = diffSec % 60;
        
        let res = "";
        if (h > 0) res += `${h}時間`;
        if (m > 0 || h > 0) res += `${m}分`;
        res += `${s}秒`;
        return res;
    }

    function getStudyRecords() {
        const records = localStorage.getItem('timer_study_records');
        return records ? JSON.parse(records) : [];
    }

    function saveCurrentStatus() {
        localStorage.setItem('timer_current_status', JSON.stringify(currentStatus));
    }

    // --- 10秒カウントダウン表示共通ロジック ---
    function startTickerDisplay() {
        // 動いているタイマーがあれば一旦クリア
        clearInterval(tickerInterval);
        clearTimeout(tickerTimeout);

        if (!currentStatus.startTime) {
            ticker.textContent = "スタートしていません";
            return;
        }

        const updateTicker = () => {
            const elapsedMs = new Date() - new Date(currentStatus.startTime);
            const elapsedSec = Math.floor(elapsedMs / 1000);
            ticker.textContent = `経過時間: ${elapsedSec}秒`;
        };

        updateTicker(); // 初回実行
        tickerInterval = setInterval(updateTicker, 1000);

        // 10秒後に非表示にする
        tickerTimeout = setTimeout(() => {
            clearInterval(tickerInterval);
            ticker.textContent = "";
        }, 10000);
    }

    // --- 各ボタンのイベント処理 ---

    // 1. スタートボタン
    startBtn.addEventListener('click', () => {
        console.log("開始");
        const now = new Date();
        currentStatus.startTime = now.toISOString();

currentStatus.stopTime = null; // 新しく始めたら終了時間はクリア
stopTimeDisp.textContent = "-";
startTimeDisp.textContent = formatTime(now);
saveCurrentStatus();
startTickerDisplay();
});
// 2. 確認ボタン
confirmBtn.addEventListener('click', () => {
startTickerDisplay();
});
// 3. ストップボタン
stopBtn.addEventListener('click', () => {
if (!currentStatus.startTime) {
alert("スタートされていません。");
return;
}
const now = new Date();
currentStatus.stopTime = now.toISOString();
stopTimeDisp.textContent = formatTime(now);
saveCurrentStatus();
// ストップ時は経過表示をクリア
clearInterval(tickerInterval);
clearTimeout(tickerTimeout);
ticker.textContent = "";
});
// 5. 記録するボタン
saveBtn.addEventListener('click', () => {
const memoText = memoInput.value.trim();
const hasTimeData = currentStatus.startTime && currentStatus.stopTime;
// バリデーションアラート
if (!hasTimeData || !memoText) {
alert("作業時間のデータ（スタートとストップ）と、メモ欄への入力が両方必要です。");
return;
}
// 保存用オブジェクト作成 (日付は開始日を基準)
const startDateObj = new Date(currentStatus.startTime);
const recordDateStr = formatDate(startDateObj);
const newRecord = {
id: Date.now(),
date: recordDateStr, // YYYY-MM-DD
startTime: currentStatus.startTime,
stopTime: currentStatus.stopTime,
memo: memoText
};
// 既存の記録配列に追加
const records = getStudyRecords();
records.push(newRecord);
localStorage.setItem('timer_study_records', JSON.stringify(records));
// 現在の状況を削除・初期化
currentStatus = { startTime: null, stopTime: null };
localStorage.removeItem('timer_current_status');
localStorage.removeItem('timer_current_memo');
startTimeDisp.textContent = "-";
stopTimeDisp.textContent = "-";
memoInput.value = "";
ticker.textContent = "";
// alert("記録しました！");
// 表示エリアをクリア（または現在の選択状態に合わせて更新も可、今回はクリア）
displayArea.innerHTML = '記録されました。確認するには日付の選択か全体の記録を押してください。';
datePicker.value = "";
});
// 7. カレンダーピッカー連動
datePicker.addEventListener('change', () => {
const selectedDate = datePicker.value; // YYYY-MM-DD
if (!selectedDate) return;
const records = getStudyRecords();
// 選択された日付に一致するデータを抽出
const filtered = records.filter(r => r.date === selectedDate);
displayArea.innerHTML = ""; // 初期化
if (filtered.length === 0) {
displayArea.innerHTML = '該当日の記録はありません。';
return;
}
filtered.forEach(r => {
const startLog = formatTime(new Date(r.startTime));
const stopLog = formatTime(new Date(r.stopTime));
const duration = calculateDuration(r.startTime, r.stopTime);
const item = document.createElement('div');
item.className = 'list-item';
item.innerHTML = `<div class="memo">${r.memo}</div> <div class="meta">時間: ${startLog} 〜 ${stopLog} （作業時間: ${duration}）</div>;`
displayArea.appendChild(item);
});
});
// 8. 全体の記録ボタン
totalRecordBtn.addEventListener('click', () => {
datePicker.value = ""; // カレンダーピッカーの選択表示をクリア
const records = getStudyRecords();
displayArea.innerHTML = ""; // 初期化
if (records.length === 0) {
displayArea.innerHTML = '学習記録がありません。';
return;
}
// 日付ごとに合計時間を集計 (ミリ秒換算で集計)
const summary = {};
records.forEach(r => {
const diffMs = new Date(r.stopTime) - new Date(r.startTime);
const validDiff = diffMs > 0 ? diffMs : 0;
if (!summary[r.date]) {
summary[r.date] = 0;
}
summary[r.date] += validDiff;
});
// 日付順（降順：新しい順）にソートして表示
const sortedDates = Object.keys(summary).sort((a, b) => b.localeCompare(a));
sortedDates.forEach(date => {
const totalMs = summary[date];
const diffSec = Math.floor(totalMs / 1000);
const h = Math.floor(diffSec / 3600);
const m = Math.floor((diffSec % 3600) / 60);
const s = diffSec % 60;
let totalStr = "";
if (h > 0) totalStr += `${h}時間`;
if (m > 0 || h > 0) totalStr += `${m}分`;
totalStr += `${s}秒`;
const item = document.createElement('div');
item.className = 'summary-item';
item.innerHTML = `<div style="font-weight: 500;">${date}</div> <div style="font-weight: bold; color: var(--primary-color);">${totalStr}</div>;`
displayArea.appendChild(item);
});
});
// 9. 表示を消すボタン
clearViewBtn.addEventListener('click', () => {
datePicker.value = ""; // カレンダーピッカーをリセット
displayArea.innerHTML = '非表示にしました。';
});
   
