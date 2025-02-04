// -----------------------
// Global Variables & Constants
// -----------------------
let daftarNamaAwal = [];
let daftarNama = [];
let namaTerpilihSebelumnya = [];
const namaPerHalaman = 10;
let currentPage = 1;
let messageTimeout; // Untuk menyimpan timeout pesan

// -----------------------
// Utility Functions
// -----------------------

/**
 * Menampilkan pesan notifikasi.
 * @param {string} message - Pesan yang ingin ditampilkan.
 * @param {string} [type='success'] - Jenis pesan (success, error, warning, info).
 */
function showMessage(message, type = 'success') {
    const messageArea = document.getElementById('messageArea');

    if (!messageArea) {
        console.error('Element #messageArea tidak ditemukan!');
        return;
    }

    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }

    messageArea.textContent = message;
    messageArea.style.display = 'flex';
    messageArea.className = `message ${type} show`;

    messageTimeout = setTimeout(() => {
        messageArea.classList.remove('show');
        messageArea.style.display = 'none';
    }, 3000);
}

/**
 * Menampilkan overlay dengan efek transisi.
 * @param {string} overlayId - ID dari elemen overlay.
 */
function showOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    overlay.style.display = 'flex';
    overlay.offsetHeight; // Force reflow
    overlay.classList.add('active');
}

/**
 * Menutup overlay dengan efek transisi.
 * @param {string} overlayId - ID dari elemen overlay.
 */
function closeOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300); // Durasi transisi yang sesuai
}

// -----------------------
// UI Update Functions
// -----------------------

/**
 * Memperbarui placeholder pada textarea berdasarkan metode pemisah.
 */
function updatePlaceholder() {
    const metodePisah = document.getElementById('metodePisahNama').value;
    const textarea = document.getElementById('inputNama');
    const placeholders = {
        newline: "John Doe\nJane Smith\nBob Johnson",
        comma: "John Doe, Jane Smith, Bob Johnson",
        semicolon: "John Doe; Jane Smith; Bob Johnson"
    };
    textarea.placeholder = placeholders[metodePisah];
}

/**
 * Memperbarui tampilan hasil seperti total nama dan total pemenang.
 */
function perbaruiHasil() {
    document.getElementById('totalNama').textContent = daftarNamaAwal.length;
    document.getElementById('totalPemenang').textContent = namaTerpilihSebelumnya.length;
    renderNamaTerpilihPage(currentPage);
}

/**
 * Merender daftar pemenang berdasarkan halaman.
 * @param {number} page - Nomor halaman yang akan dirender.
 */
function renderNamaTerpilihPage(page) {
    const start = (page - 1) * namaPerHalaman;
    const end = start + namaPerHalaman;
    const currentNames = namaTerpilihSebelumnya.slice(start, end);

    const namaTerpilihList = document.getElementById('namaTerpilihList');
    namaTerpilihList.innerHTML = currentNames
        .map((name, index) => `<li data-index="${start + index + 1}">${name}</li>`)
        .join('');

    setupPagination();
}

/**
 * Membuat dan mengatur tombol-tombol pagination.
 */
function setupPagination() {
    const totalPages = Math.ceil(namaTerpilihSebelumnya.length / namaPerHalaman);
    const paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.onclick = () => {
            currentPage = i;
            renderNamaTerpilihPage(i);
        };
        paginationContainer.appendChild(button);
    }
}

/**
 * Mencari nama pemenang berdasarkan input pencarian.
 */
function searchNames() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredNames = namaTerpilihSebelumnya.filter(name => name.toLowerCase().includes(searchTerm));
    const namaTerpilihList = document.getElementById('namaTerpilihList');
    namaTerpilihList.innerHTML = filteredNames.map(name => `<li>${name}</li>`).join('');
}

/**
 * Mengupdate daftar nama pemenang yang baru saja dipilih.
 * @param {string[]} names - Daftar nama pemenang.
 */
function updateSelectedNamesList(names) {
    const selectedNamesList = document.getElementById('selectedNames');
    selectedNamesList.innerHTML = names
        .map((name, index) => `<li>${index + 1}. ${name}</li>`)
        .join('');
}

// -----------------------
// Data Management Functions
// -----------------------

/**
 * Mengambil input dari textarea dan menyusun daftar nama.
 */
function setDaftarNama() {
    const input = document.getElementById('inputNama').value;
    const metodePisah = document.getElementById('metodePisahNama').value;
    const separator = metodePisah === 'comma' ? ',' : metodePisah === 'semicolon' ? ';' : '\n';
    const names = input
        .split(separator)
        .map(name => name.trim())
        .filter(name => name !== '');

    if (names.length === 0) {
        showMessage('No valid names found!', 'error');
        return;
    }

    // Cek duplikat
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
        showMessage(`Duplicate names found: ${duplicates.join(', ')}`, 'warning');
    }

    daftarNamaAwal = [...new Set(names)]; // Hapus duplikat
    daftarNama = [...daftarNamaAwal];
    localStorage.setItem('daftarNama', JSON.stringify(daftarNamaAwal));
    console.log('Daftar nama awal:', daftarNamaAwal);
    perbaruiHasil();
    showMessage('Name list has been updated!', 'success');
}

/**
 * Mereset daftar nama ke keadaan awal.
 */
function resetDaftarNama() {
    daftarNama = [...daftarNamaAwal];
    namaTerpilihSebelumnya = [];
    perbaruiHasil();
    showMessage('Name list has been reset!', 'success');
}

/**
 * Mengimpor daftar nama dari file .txt.
 * @param {Event} event - Event perubahan file.
 */
function importDaftarNama(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'text/plain') {
        showMessage('Please upload a .txt file!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        if (!validateNames(content)) return;
        document.getElementById('inputNama').value = content;
        setDaftarNama();
    };
    reader.readAsText(file);
}

/**
 * Memvalidasi input nama.
 * @param {string} names - Isi input nama.
 * @returns {boolean} - True jika valid, false jika tidak.
 */
function validateNames(names) {
    if (!names || names.trim() === "") {
        showMessage('Input names cannot be empty!', 'error');
        return false;
    }
    return true;
}

/**
 * Mengacak ulang daftar nama dan memperbarui textarea.
 */
function acakUlangDaftarNama() {
    daftarNama = [...daftarNamaAwal].sort(() => Math.random() - 0.5);
    const textarea = document.getElementById('inputNama');
    textarea.value = daftarNama.join('\n');
    showMessage('Daftar nama telah diacak ulang!', 'success');
}

/**
 * Mengekspor daftar nama awal ke file .txt.
 */
function exportDaftarNama() {
    if (daftarNamaAwal.length === 0) {
        showMessage('No names to export!', 'error');
        return;
    }

    const metodePisah = document.getElementById('metodePisahNama').value;
    const separator = metodePisah === 'comma' ? ',' : metodePisah === 'semicolon' ? ';' : '\n';
    const content = daftarNamaAwal.join(separator);

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'names.txt';
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Menghapus semua data yang tersimpan dan mereset state aplikasi.
 */
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        localStorage.clear();
        daftarNamaAwal = [];
        daftarNama = [];
        namaTerpilihSebelumnya = [];
        document.getElementById('inputNama').value = '';
        document.getElementById('metodePisahNama').value = 'newline';
        document.getElementById('jumlahPemenang').value = '1';
        document.getElementById('enableAnimation').checked = true;
        updatePlaceholder();
        perbaruiHasil();
        showMessage('All data has been cleared!', 'success');
    }
}

// -----------------------
// Animation & Winner Notification Functions
// -----------------------

/**
 * Menampilkan animasi pemilihan nama secara acak.
 * @returns {Promise} - Promise yang diselesaikan setelah animasi selesai.
 */
function showAnimation() {
    return new Promise(resolve => {
        const overlay = document.getElementById('animationOverlay');
        const content = document.getElementById('animationContent');
        const selectedNamesList = document.querySelector('.selected-names-list');

        overlay.style.display = 'flex';
        overlay.offsetHeight; // Force reflow
        overlay.classList.add('active');

        selectedNamesList.style.display = 'none';
        content.style.display = 'block';

        const durasiPengacakan = parseInt(document.getElementById('durasiPengacakan').value) * 1000;
        let startTime = Date.now();
        let interval = 100;

        function updateAnimation() {
            if (Date.now() - startTime > durasiPengacakan) {
                content.style.display = 'none';
                selectedNamesList.style.display = 'block';
                resolve();
                return;
            }

            const namaAcak = daftarNamaAwal[Math.floor(Math.random() * daftarNamaAwal.length)];
            content.textContent = namaAcak;

            setTimeout(updateAnimation, interval);
        }

        updateAnimation();
    });
}

/**
 * Menampilkan notifikasi pemenang dengan hitungan mundur.
 */
function showWinnerNotification() {
    let countdown = 5; // Hitungan mundur 5 detik
    showMessage(`Menghapus Pemenang dalam ${countdown} detik...`, 'info');

    const countdownInterval = setInterval(() => {
        countdown--;
        showMessage(`Menghapus Pemenang dalam ${countdown} detik...`, 'info');

        if (countdown <= 0) {
            clearInterval(countdownInterval);
            // Jika ingin menghapus pemenang setelah hitungan, uncomment baris di bawah:
            // removeWinner();
            showMessage('', 'info');
            document.getElementById('messageArea').style.display = 'none';
        }
    }, 1000);
}

/**
 * Menghapus pemenang terakhir dari daftar pemenang.
 */
function removeWinner() {
    if (namaTerpilihSebelumnya.length > 0) {
        namaTerpilihSebelumnya.pop();
        perbaruiHasil();
        showMessage('Pemenang telah dihapus.', 'info');
    }
}

// -----------------------
// Name Selection Functions
// -----------------------

/**
 * Memilih nama secara acak dengan animasi, menampilkan notifikasi, dan memperbarui daftar pemenang.
 */
async function pilihNamaAcak() {
    const jumlahPemenang = parseInt(document.getElementById('jumlahPemenang').value);

    if (daftarNama.length === 0) {
        showMessage('No names available!', 'error');
        return;
    }

    if (jumlahPemenang > daftarNama.length) {
        showMessage('Not enough names available!', 'error');
        return;
    }

    // Tampilkan animasi pemilihan
    await showAnimation();

    let pemenang = [];
    for (let i = 0; i < jumlahPemenang; i++) {
        let indeksAcak = Math.floor(Math.random() * daftarNama.length);
        pemenang.push(daftarNama.splice(indeksAcak, 1)[0]);
    }

    namaTerpilihSebelumnya.push(...pemenang);
    perbaruiHasil();

    // Tampilkan notifikasi pemenang dengan countdown
    showWinnerNotification();
    updateSelectedNamesList(pemenang);
    showOverlay('animationOverlay');
}

// -----------------------
// Event Listeners & Initialization
// -----------------------

// Event listener: Menangani event keydown (spasi) untuk memilih nama
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        event.preventDefault(); // Mencegah scrolling
        pilihNamaAcak();
    }
});

// Event listener: Menutup overlay saat klik di luar area konten
document.getElementById('guideOverlay').addEventListener('click', function(event) {
    if (event.target === this) {
        closeOverlay('guideOverlay');
    }
});

document.getElementById('versionOverlay').addEventListener('click', function(event) {
    if (event.target === this) {
        closeOverlay('versionOverlay');
    }
});

document.getElementById('animationOverlay').addEventListener('click', function(event) {
    if (event.target === this) {
        closeOverlay('animationOverlay');
    }
});

// Fungsi untuk menampilkan overlay panduan dan versi
function showGuide() {
    showOverlay('guideOverlay');
}

function showVersion() {
    showOverlay('versionOverlay');
}

// Inisialisasi data saat window load
window.onload = function() {
    const savedNames = localStorage.getItem('daftarNama');
    if (savedNames) {
        daftarNamaAwal = JSON.parse(savedNames);
        document.getElementById('inputNama').value = daftarNamaAwal.join('\n');
        resetDaftarNama();
    }
    updatePlaceholder();
};