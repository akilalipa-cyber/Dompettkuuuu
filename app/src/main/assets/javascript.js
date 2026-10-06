/* =====================================================
   DOMPETKUU - JAVASCRIPT
===================================================== */

"use strict";

/* =====================================================
   DOM ELEMENTS
===================================================== */

const form = document.getElementById("transactionForm");

const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");
const transactionTypeInput = document.getElementById("transactionType");
const categoryInput = document.getElementById("category");
const reasonInput = document.getElementById("reason");
const expenseFields = document.getElementById("expenseFields");
const reasonGroup = document.getElementById("reasonGroup");

const transactionList = document.getElementById("transactionList");

const saldoElement = document.getElementById("saldo");
const totalIncomeElement = document.getElementById("totalIncome");
const totalExpenseElement = document.getElementById("totalExpense");
const transactionCountElement = document.getElementById("transactionCount");
const expenseRatioElement = document.getElementById("expenseRatio");

const financialStatus = document.getElementById("financialStatus");
const statusIcon = document.getElementById("statusIcon");
const statusDescription = document.getElementById("statusDescription");
const progressBar = document.getElementById("progressBar");
const analysisContent = document.getElementById("analysisContent");

const clearTransactions = document.getElementById("clearTransactions");
const themeToggle = document.getElementById("themeToggle");
const typeButtons = document.querySelectorAll(".type-btn");

/* =====================================================
   STORAGE KEYS & STATE
===================================================== */

const STORAGE_KEY = "dompetkuu_transactions_v2";
const LEGACY_STORAGE_KEY = "dompetkuu_transactions";
const THEME_KEY = "dompetkuu_darkmode";

let transactions = [];

/* =====================================================
   UTILITY FUNCTIONS
===================================================== */

function generateId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return "txn_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatRupiah(value) {
    const number = Number(value) || 0;
    return "Rp" + new Intl.NumberFormat("id-ID").format(number);
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const parts = String(dateStr).split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function setDefaultDate() {
    if (!dateInput) return;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${year}-${month}-${day}`;
}

/* =====================================================
   LOCAL STORAGE HANDLING
===================================================== */

function loadTransactions() {
    try {
        let data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            data = localStorage.getItem(LEGACY_STORAGE_KEY);
        }

        if (!data) {
            transactions = [];
            return;
        }

        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
            transactions = parsed.filter(item => item && typeof item === "object");
        } else {
            transactions = [];
        }
    } catch (error) {
        console.error("Gagal memuat transaksi:", error);
        transactions = [];
    }
}

function saveTransactions() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        return true;
    } catch (error) {
        console.error("Gagal menyimpan transaksi:", error);
        alert("Transaksi gagal disimpan.");
        return false;
    }
}

/* =====================================================
   TRANSACTION TYPE & CATEGORY HANDLING
===================================================== */

function setTransactionType(type) {
    const targetType = type === "expense" ? "expense" : "income";

    if (transactionTypeInput) {
        transactionTypeInput.value = targetType;
    }

    typeButtons.forEach(btn => {
        if (btn.dataset.type === targetType) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    if (targetType === "expense") {
        if (expenseFields) {
            expenseFields.classList.remove("hidden");
        }
        handleCategoryChange();
    } else {
        if (expenseFields) {
            expenseFields.classList.add("hidden");
        }
        if (reasonGroup) {
            reasonGroup.classList.add("hidden");
        }
        if (reasonInput) {
            reasonInput.required = false;
            reasonInput.value = "";
        }
    }
}

function handleCategoryChange() {
    if (!categoryInput || !reasonGroup || !reasonInput) return;

    const isExpense = transactionTypeInput ? transactionTypeInput.value === "expense" : false;
    const isLainnya = categoryInput.value === "Lainnya";

    if (isExpense && isLainnya) {
        reasonGroup.classList.remove("hidden");
        reasonInput.required = true;
    } else {
        reasonGroup.classList.add("hidden");
        reasonInput.required = false;
        reasonInput.value = "";
    }
}

/* =====================================================
   FORM SUBMISSION
===================================================== */

if (form) {
    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const rawAmount = amountInput ? amountInput.value.trim() : "";
        if (rawAmount === "") {
            alert("Nominal belum diisi.");
            if (amountInput) amountInput.focus();
            return;
        }

        const amount = Number(rawAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Nominal harus lebih besar dari Rp0.");
            if (amountInput) amountInput.focus();
            return;
        }

        const type = transactionTypeInput ? transactionTypeInput.value : "income";
        const date = dateInput ? dateInput.value : "";
        const description = descriptionInput ? descriptionInput.value.trim() : "";

        if (!date) {
            alert("Tanggal belum dipilih.");
            if (dateInput) dateInput.focus();
            return;
        }

        if (!description) {
            alert("Keterangan belum diisi.");
            if (descriptionInput) descriptionInput.focus();
            return;
        }

        let category = "";
        let reason = "";

        if (type === "expense") {
            category = categoryInput ? categoryInput.value : "";
            if (!category) {
                alert("Pilih kategori pengeluaran.");
                if (categoryInput) categoryInput.focus();
                return;
            }

            if (category === "Lainnya") {
                reason = reasonInput ? reasonInput.value.trim() : "";
                if (!reason) {
                    alert("Alasan pembelian wajib diisi.");
                    if (reasonInput) reasonInput.focus();
                    return;
                }
            }
        }

        const transaction = {
            id: generateId(),
            type: type,
            amount: amount,
            date: date,
            description: description,
            category: category,
            reason: reason,
            createdAt: new Date().toISOString()
        };

        transactions.unshift(transaction);

        const saved = saveTransactions();
        if (!saved) {
            transactions.shift();
            return;
        }

        updateDashboard();
        renderTransactions();

        form.reset();
        setTransactionType("income");
        setDefaultDate();

        alert(
            type === "income"
                ? "Uang masuk berhasil disimpan!"
                : "Uang keluar berhasil disimpan!"
        );
    });
}

/* =====================================================
   DASHBOARD CALCULATIONS
===================================================== */

function updateDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
        const amount = Number(transaction.amount) || 0;
        if (transaction.type === "income") {
            totalIncome += amount;
        } else if (transaction.type === "expense") {
            totalExpense += amount;
        }
    });

    const saldo = totalIncome - totalExpense;

    if (saldoElement) {
        saldoElement.textContent = formatRupiah(saldo);
    }

    if (totalIncomeElement) {
        totalIncomeElement.textContent = formatRupiah(totalIncome);
    }

    if (totalExpenseElement) {
        totalExpenseElement.textContent = formatRupiah(totalExpense);
    }

    if (transactionCountElement) {
        transactionCountElement.textContent = String(transactions.length);
    }

    let ratio = 0;
    if (totalIncome > 0) {
        ratio = (totalExpense / totalIncome) * 100;
    }

    if (expenseRatioElement) {
        expenseRatioElement.textContent = totalIncome > 0 ? `${ratio.toFixed(1)}%` : "0%";
    }

    updateFinancialStatus(ratio, totalIncome, totalExpense, saldo);
}

/* =====================================================
   FINANCIAL STATUS & ANALYSIS
===================================================== */

function updateFinancialStatus(ratio, income, expense, saldo) {
    let status;
    let icon;
    let description;
    let progressPercent = 0;

    if (transactions.length === 0) {
        status = "Belum Ada Data";
        icon = "—";
        description = "Tambahkan transaksi untuk melihat analisis keuangan.";
        progressPercent = 0;
    } else if (income <= 0) {
        status = "Belum Ada Pemasukan";
        icon = "—";
        description = "Tambahkan pemasukan sebelum melakukan analisis keuangan.";
        progressPercent = 100;
    } else if (ratio <= 30) {
        status = "Cerdas";
        icon = "★";
        description = "Pengeluaran sangat terkendali.";
        progressPercent = ratio;
    } else if (ratio <= 50) {
        status = "Hemat";
        icon = "✓";
        description = "Pengeluaran cukup terkendali.";
        progressPercent = ratio;
    } else if (ratio <= 75) {
        status = "Normal";
        icon = "●";
        description = "Pengeluaran masih dalam batas normal.";
        progressPercent = ratio;
    } else {
        status = "Boros";
        icon = "!";
        description = "Pengeluaran cukup tinggi dibandingkan pemasukan.";
        progressPercent = Math.min(ratio, 100);
    }

    if (financialStatus) {
        financialStatus.textContent = status;
    }

    if (statusIcon) {
        statusIcon.textContent = icon;
    }

    if (statusDescription) {
        statusDescription.textContent = description;
    }

    if (progressBar) {
        const clamped = Math.min(Math.max(progressPercent, 0), 100);
        progressBar.style.width = `${clamped}%`;
    }

    generateAnalysis(ratio, income, expense, saldo);
}

function generateAnalysis(ratio, income, expense, saldo) {
    if (!analysisContent) return;

    if (transactions.length === 0) {
        analysisContent.innerHTML = `<p class="muted">Belum ada data.</p>`;
        return;
    }

    let message = "";

    if (income <= 0) {
        message = `
            <p>
                Saat ini belum ada pemasukan.
                Tambahkan pemasukan untuk mengetahui kondisi keuangan secara lengkap.
            </p>
        `;
    } else if (ratio <= 30) {
        message = `
            <p>
                Sangat baik. Pengeluaranmu hanya ${ratio.toFixed(1)}% dari total pemasukan.
            </p>
        `;
    } else if (ratio <= 50) {
        message = `
            <p>
                Kondisi cukup hemat. Pengeluaran berada pada ${ratio.toFixed(1)}% dari pemasukan.
            </p>
        `;
    } else if (ratio <= 75) {
        message = `
            <p>
                Pengeluaran masih normal, tetapi sebaiknya mulai memperhatikan pembelian yang tidak terlalu penting.
            </p>
        `;
    } else {
        message = `
            <p>
                Pengeluaran mencapai ${ratio.toFixed(1)}% dari pemasukan. Prioritaskan kebutuhan utama.
            </p>
        `;
    }

    analysisContent.innerHTML = `
        ${message}
        <div class="analysis-summary">
            <p><strong>Saldo:</strong> ${formatRupiah(saldo)}</p>
            <p><strong>Total pemasukan:</strong> ${formatRupiah(income)}</p>
            <p><strong>Total pengeluaran:</strong> ${formatRupiah(expense)}</p>
        </div>
    `;
}

/* =====================================================
   TRANSACTION LIST RENDERING
===================================================== */

function renderTransactions() {
    if (!transactionList) return;

    if (transactions.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <div>📊</div>
                <h3>Belum ada transaksi</h3>
                <p>Tambahkan transaksi pertama.</p>
            </div>
        `;
        return;
    }

    transactionList.innerHTML = transactions.map(function(transaction) {
        const isIncome = transaction.type === "income";
        const sign = isIncome ? "+" : "-";
        const typeText = isIncome ? "Uang Masuk" : "Uang Keluar";

        let extra = "";
        if (!isIncome) {
            extra = `
                <small>Kategori: ${escapeHTML(transaction.category || "-")}</small>
                ${
                    transaction.reason
                        ? `<small>Alasan: ${escapeHTML(transaction.reason)}</small>`
                        : ""
                }
            `;
        }

        return `
            <div class="transaction-item ${isIncome ? "income" : "expense"}">
                <div class="transaction-info">
                    <strong>${escapeHTML(transaction.description)}</strong>
                    <span>${formatDate(transaction.date)}</span>
                    <small>${typeText}</small>
                    ${extra}
                </div>
                <div class="transaction-right">
                    <strong>${sign}${formatRupiah(transaction.amount)}</strong>
                    <button
                        type="button"
                        class="delete-btn"
                        data-id="${escapeHTML(transaction.id)}"
                    >
                        Hapus
                    </button>
                </div>
            </div>
        `;
    }).join("");

    const deleteButtons = transactionList.querySelectorAll(".delete-btn");
    deleteButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            const id = this.dataset.id;
            const confirmed = confirm("Yakin ingin menghapus transaksi ini?");
            if (!confirmed) return;

            transactions = transactions.filter(function(transaction) {
                return String(transaction.id) !== String(id);
            });

            saveTransactions();
            updateDashboard();
            renderTransactions();
        });
    });
}

/* =====================================================
   CLEAR ALL TRANSACTIONS
===================================================== */

if (clearTransactions) {
    clearTransactions.addEventListener("click", function() {
        if (transactions.length === 0) {
            alert("Belum ada transaksi.");
            return;
        }

        const confirmed = confirm("Yakin ingin menghapus semua transaksi?");
        if (!confirmed) return;

        transactions = [];

        saveTransactions();
        updateDashboard();
        renderTransactions();
    });
}

/* =====================================================
   DARK MODE
===================================================== */

if (themeToggle) {
    themeToggle.addEventListener("click", function() {
        document.body.classList.toggle("dark-mode");
        const enabled = document.body.classList.contains("dark-mode");

        try {
            localStorage.setItem(THEME_KEY, enabled ? "true" : "false");
        } catch (error) {
            console.error("Gagal menyimpan tema:", error);
        }

        themeToggle.textContent = enabled ? "☀" : "☾";
    });
}

function loadDarkMode() {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === "true") {
            document.body.classList.add("dark-mode");
            if (themeToggle) themeToggle.textContent = "☀";
        } else {
            document.body.classList.remove("dark-mode");
            if (themeToggle) themeToggle.textContent = "☾";
        }
    } catch (error) {
        console.error("Gagal memuat tema:", error);
    }
}

/* =====================================================
   INITIALIZATION
===================================================== */

function init() {
    loadTransactions();
    loadDarkMode();
    setDefaultDate();
    setTransactionType("income");

    if (categoryInput) {
        categoryInput.addEventListener("change", handleCategoryChange);
    }

    typeButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            setTransactionType(this.dataset.type);
        });
    });

    updateDashboard();
    renderTransactions();

    console.log("DOMPETKUU berhasil dijalankan.");
}

// Run initialization immediately since script is loaded at the end of body
init();
