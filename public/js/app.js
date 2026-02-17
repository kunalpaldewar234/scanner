let inventory = [];
let cart = [];
let scanner = null;

/* ================= LOAD INVENTORY ================= */

function loadInventory() {
  fetch("/inventory")
    .then(res => res.json())
    .then(data => {
      inventory = data;
      renderInventory();
    });
}

loadInventory();

/* ================= ADD INVENTORY ================= */

function addInventory() {
  const sku = document.getElementById("sku").value.trim().toUpperCase();
  const name = document.getElementById("name").value.trim();
  const price = parseFloat(document.getElementById("price").value);

  if (!sku || !name || !price) {
    alert("Please fill all fields");
    return;
  }

  fetch("/add-item", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sku, name, price })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    loadInventory();
  });
}


/* ================= DELETE ================= */

function deleteInventoryItem(sku) {
  fetch(`/inventory/${sku}`, {
    method: "DELETE"
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    loadInventory();
  })
  .catch(err => {
    console.log(err);
    alert("Delete failed");
  });
}


/* ================= RENDER INVENTORY ================= */

function fmt(x) {
  return Number(x).toFixed(2);
}

function renderInventory() {
  const tbody = document.querySelector("#inventoryTable tbody");

  tbody.innerHTML = inventory.map(item => `
    <tr>
      <td>${item.sku}</td>
      <td>${item.name}</td>
      <td>₹${fmt(item.price)}</td>
      <td><button onclick="addToCart('${item.sku}')">Add</button></td>
      <td><button onclick="deleteInventoryItem('${item.sku}')">Delete</button></td>
    </tr>
  `).join("");
}

/* ================= CART ================= */

function addToCart(sku) {
  const item = inventory.find(i => i.sku === sku);
  if (!item) return alert("Item not found");

  const existing = cart.find(c => c.sku === sku);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  renderCart();
}

function renderCart() {
  const tbody = document.getElementById("cartTable");

  tbody.innerHTML = cart.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.sku}</td>
      <td>${item.quantity}</td>
      <td>₹${fmt(item.price)}</td>
      <td>₹${fmt(item.price * item.quantity)}</td>
    </tr>
  `).join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById("grandTotal").textContent = fmt(total);
}

function refreshCart() {
  cart = [];
  renderCart();
}

/* ================= PRINT ================= */
function printBill() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const customerName = document.getElementById("custName").value || "Walk-in Customer";
  const customerMobile = document.getElementById("custMobile").value || "N/A";
  const paymentMode = document.querySelector('input[name="payMode"]:checked').value;

  const now = new Date().toLocaleString();

  let itemsHTML = "";
  let total = 0;

  cart.forEach(item => {
    const amount = item.price * item.quantity;
    total += amount;

    itemsHTML += `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:right;">₹${amount.toFixed(2)}</td>
      </tr>
    `;
  });

  const billContent = `
    <html>
    <head>
      <title>Receipt</title>
      <style>
        body {
          width: 80mm;
          font-family: monospace;
          padding: 10px;
        }
        h2 {
          text-align: center;
          margin: 5px 0;
        }
        hr {
          border-top: 1px dashed black;
        }
        table {
          width: 100%;
          font-size: 12px;
          border-collapse: collapse;
        }
        th, td {
          padding: 3px 0;
        }
        .center {
          text-align: center;
        }
        .right {
          text-align: right;
        }
        .bold {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <h2>Vyankatesh Masala</h2>
      <div class="center">-----------------------------</div>
      <p>Date: ${now}</p>
      <p>Customer: ${customerName}</p>
      <p>Mobile: ${customerMobile}</p>
      <p>Payment: ${paymentMode}</p>
      <div class="center">-----------------------------</div>

      <table>
        <thead>
          <tr>
            <th align="left">Item</th>
            <th>Qty</th>
            <th align="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="center">-----------------------------</div>
      <p class="bold right">Total: ₹${total.toFixed(2)}</p>
      <div class="center">-----------------------------</div>

      <p class="center">♥ Thank you for your visit!</p>
      <p class="center">Visit again soon.</p>

      <script>
        window.print();
        window.onafterprint = function() {
          window.close();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open("", "", "width=400,height=600");
  printWindow.document.write(billContent);
  printWindow.document.close();

  // ✅ AUTO CLEAR CART AFTER PRINT
  cart = [];
  renderCart();
}


let html5QrCode;

function startScanner() {
  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: 250
    },
    (decodedText) => {
      document.getElementById("barcodeInput").value = decodedText;
      manualBarcode();
      stopScanner();
    },
    (errorMessage) => {
      // ignore scan errors
    }
  ).catch(err => {
    console.log("Camera error:", err);
  });
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop()
      .then(() => {
        html5QrCode.clear();
      })
      .catch(err => {
        console.log("Stop error:", err);
      });
  }
}
/* ================= MANUAL BARCODE ================= */
function manualBarcode() {
  const skuInput = document.getElementById("barcodeInput").value.trim().toUpperCase();
  if (!skuInput) {
    alert("Please enter SKU");
    return;
  }

  addToCart(skuInput); // Reuse existing addToCart function
  document.getElementById("barcodeInput").value = ""; // Clear input
}
