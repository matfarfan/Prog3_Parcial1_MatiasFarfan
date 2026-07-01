import { PEDIDOS, PRODUCTS } from "../../../data/data";
import type { Order, OrderDetail } from "../../../types/orders";
import type { EstadoPedido } from "../../../types/EstadoPedido";
import type { FormaPago } from "../../../types/FormaPago";
import { logout, checkAuthUser } from "../../../utils/auth";

type ClientOrderDetail = {
  productoId: number;
  cantidad: number;
  subtotal: number;
};

type ClientOrder = {
  id: number;
  fecha: string;
  estado: string;
  total: number;
  formaPago: string;
  usuarioNombre?: string;
  usuarioApellido?: string;
  usuarioEmail?: string;
  usuarioCelular?: string;
  detalles: ClientOrderDetail[];
};

const statusModal = document.getElementById("status-modal");
const closeStatusModal = document.getElementById("close-status-modal");
const statusModalText = document.getElementById("status-modal-text");
const advanceStatusButton = document.getElementById("advance-status-button");
const cancelOrderButton = document.getElementById("cancel-order-button");

let selectedOrder: Order | null = null;

const ordersContainer = document.getElementById("orders-container");
const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement;
const orderDetailModal = document.getElementById("order-detail-modal");
const closeOrderDetailModal = document.getElementById("close-order-detail-modal");
const orderDetailContent = document.getElementById("order-detail-content");
const orderStatusFilter = document.getElementById(
  "order-status-filter"
) as HTMLSelectElement;

buttonLogout?.addEventListener("click", () => {
  logout();
});

closeOrderDetailModal?.addEventListener("click", () => {
  orderDetailModal?.classList.add("hidden");
});

orderDetailModal?.addEventListener("click", (event) => {
  if (event.target === orderDetailModal) {
    orderDetailModal.classList.add("hidden");
  }
});

checkAuthUser(
  "/src/pages/auth/login/login.html",
  "/src/pages/admin/orders/orders.html",
  "admin"
);

const orders = getAllOrders().sort(
  (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
);

renderOrders(orders);

orderStatusFilter?.addEventListener("change", () => {
  const selectedStatus = orderStatusFilter.value;

  if (selectedStatus === "TODOS") {
    renderOrders(orders);
    return;
  }

  const filteredOrders = orders.filter((order) => order.estado === selectedStatus);
  renderOrders(filteredOrders);
});

function renderOrders(ordersToRender: Order[]) {
  if (!ordersContainer) return;

  if (ordersToRender.length === 0) {
    ordersContainer.innerHTML = `
      <div class="empty-state">
        <h3>No hay pedidos para mostrar</h3>
        <p>No se encontraron pedidos con el estado seleccionado.</p>
      </div>
    `;
    return;
  }

  ordersContainer.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Fecha</th>
          <th>Cantidad</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        ${ordersToRender
          .map(
            (order) => `
              <tr>
                <td>${order.id}</td>
                <td>${order.usuarioDto.nombre} ${order.usuarioDto.apellido}</td>
                <td>${formatDate(order.fecha)}</td>
                <td>${getOrderProductQuantity(order)} productos</td>
                <td>${formatPrice(order.total)}</td>
                <td>
                  <span class="status-badge ${getOrderStatusClass(order.estado)}">
                    ${getOrderStatusText(order.estado)}
                  </span>
                </td>
                <td class="actions">
                  <button class="view-order" data-id="${order.id}">
                    Ver detalle
                  </button>

                  <button class="change-order-status" data-id="${order.id}">
                    Cambiar estado
                  </button>
                </td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;

  addOrderButtonEvents();
}

function addOrderButtonEvents() {
  const viewOrderButtons = document.querySelectorAll(".view-order");

  viewOrderButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = Number((button as HTMLButtonElement).dataset.id);
      const order = orders.find((order) => order.id === orderId);

      if (!order) {
        alert("No se encontró el pedido.");
        return;
      }

      renderOrderDetail(order);
      orderDetailModal?.classList.remove("hidden");
    });
  });

  const changeStatusButtons = document.querySelectorAll(".change-order-status");

  changeStatusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = Number((button as HTMLButtonElement).dataset.id);
      const order = orders.find((order) => order.id === orderId);

      if (!order) {
        alert("No se encontró el pedido.");
        return;
      }

      changeOrderStatus(order);
    });
  });
}

function formatPrice(price: number) {
  return price.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-AR");
}

function getOrderProductQuantity(order: Order) {
  return order.detalles.reduce((total, detail) => total + detail.cantidad, 0);
}

function getOrderStatusText(status: EstadoPedido) {
  const statusText: Partial<Record<EstadoPedido, string>> = {
    PENDIENTE: "Pendiente",
    EN_PREPARACION: "En preparación",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
  };

  return statusText[status] || status;
}

function getOrderStatusClass(status: EstadoPedido) {
  const statusClass: Partial<Record<EstadoPedido, string>> = {
    PENDIENTE: "pending",
    EN_PREPARACION: "processing",
    ENTREGADO: "available",
    CANCELADO: "unavailable",
  };

  return statusClass[status] || "pending";
}

function formatPaymentMethod(paymentMethod: FormaPago) {
  const paymentMethods: Record<FormaPago, string> = {
    EFECTIVO: "Efectivo",
    TARJETA: "Tarjeta",
    TRANSFERENCIA: "Transferencia",
  };

  return paymentMethods[paymentMethod];
}

function renderOrderDetail(order: Order) {
  if (!orderDetailContent) return;

  orderDetailContent.innerHTML = `
    <div class="order-detail">
      <div class="order-detail-summary">
        <div>
          <span class="detail-label">Pedido</span>
          <strong>#${order.id}</strong>
        </div>

        <div>
          <span class="detail-label">Fecha</span>
          <strong>${formatDate(order.fecha)}</strong>
        </div>

        <div>
          <span class="detail-label">Estado</span>
          <span class="status-badge ${getOrderStatusClass(order.estado)}">
            ${getOrderStatusText(order.estado)}
          </span>
        </div>
      </div>

      <div class="order-detail-client">
        <h3>Datos del cliente</h3>

        <p><strong>Nombre:</strong> ${order.usuarioDto.nombre} ${order.usuarioDto.apellido}</p>
        <p><strong>Email:</strong> ${order.usuarioDto.mail}</p>
        <p><strong>Celular:</strong> ${order.usuarioDto.celular}</p>
        <p><strong>Forma de pago:</strong> ${formatPaymentMethod(order.formaPago)}</p>
      </div>

      <div class="order-detail-products">
        <h3>Productos del pedido</h3>

        ${order.detalles
          .map(
            (detail: OrderDetail) => `
              <div class="order-detail-product">
                <div class="order-product-info">
                  <img 
                    src="/src/assets/images/${detail.producto.imagen}" 
                    alt="${detail.producto.nombre}"
                  >

                  <div>
                    <strong>${detail.producto.nombre}</strong>
                    <p>${detail.producto.categoria.nombre}</p>
                    <p>Cantidad: ${detail.cantidad}</p>
                    <p>Precio unitario: ${formatPrice(detail.producto.precio)}</p>
                  </div>
                </div>

                <strong>${formatPrice(detail.subtotal)}</strong>
              </div>
            `
          )
          .join("")}
      </div>

      <div class="order-detail-total">
        <span>Total del pedido</span>
        <strong>${formatPrice(order.total)}</strong>
      </div>
    </div>
  `;
}

function changeOrderStatus(order: Order) {
  if (order.estado === "ENTREGADO" || order.estado === "CANCELADO") {
    alert("Este pedido no permite más cambios de estado.");
    return;
  }

  selectedOrder = order;

  if (statusModalText) {
    const nextStatus = getNextOrderStatus(order.estado);

    statusModalText.innerHTML = `
      Pedido #${order.id}<br>
      Estado actual: <strong>${getOrderStatusText(order.estado)}</strong><br>
      Próximo estado: <strong>${nextStatus ? getOrderStatusText(nextStatus) : ""}</strong>
    `;
  }

  statusModal?.classList.remove("hidden");
}

advanceStatusButton?.addEventListener("click", () => {
  if (!selectedOrder) return;

  const newStatus = getNextOrderStatus(selectedOrder.estado);

  if (!newStatus) {
    alert("Este pedido no permite más cambios de estado.");
    return;
  }

  saveOrderStatus(selectedOrder.id, newStatus);
});

cancelOrderButton?.addEventListener("click", () => {
  if (!selectedOrder) {
    alert("No hay pedido seleccionado.");
    return;
  }

  alert(`Cancelando pedido #${selectedOrder.id}`);

  saveOrderStatus(selectedOrder.id, "CANCELADO");
});

closeStatusModal?.addEventListener("click", () => {
  statusModal?.classList.add("hidden");
  selectedOrder = null;
});

statusModal?.addEventListener("click", (event) => {
  if (event.target === statusModal) {
    statusModal.classList.add("hidden");
    selectedOrder = null;
  }
});

function saveOrderStatus(orderId: number, newStatus: EstadoPedido) {
  const updatedOrders = orders.map((currentOrder: Order) => {
    if (currentOrder.id === orderId) {
      return {
        ...currentOrder,
        estado: newStatus,
      };
    }

    return currentOrder;
  });

  localStorage.setItem("adminOrders", JSON.stringify(updatedOrders));
  updateClientOrderStatus(orderId, newStatus);

  location.reload();
}

function getNextOrderStatus(status: EstadoPedido): EstadoPedido | null {
  const statusFlow: Partial<Record<EstadoPedido, EstadoPedido | null>> = {
    PENDIENTE: "EN_PREPARACION",
    EN_PREPARACION: "ENTREGADO",
    ENTREGADO: null,
    CANCELADO: null,
  };

  return statusFlow[status] || null;
}

function getStoredOrders(): Order[] {
  const storedOrders = localStorage.getItem("adminOrders");
  return storedOrders ? (JSON.parse(storedOrders) as Order[]) : [];
}

function getClientOrders(): Order[] {
  const storedClientOrders = localStorage.getItem("pedidos");
  const clientOrders = storedClientOrders
    ? (JSON.parse(storedClientOrders) as ClientOrder[])
    : [];

  return clientOrders.map((pedido: ClientOrder) => ({
    id: pedido.id,
    fecha: pedido.fecha,
    estado: mapClientStatusToAdminStatus(pedido.estado),
    total: pedido.total,
    formaPago: mapClientPaymentToAdminPayment(pedido.formaPago),

    usuarioDto: {
      id: 0,
      nombre: pedido.usuarioNombre || "Cliente",
      apellido: pedido.usuarioApellido || "",
      mail: pedido.usuarioEmail || "Sin email",
      celular: pedido.usuarioCelular || "Sin celular",
      rol: "client",
    },

    detalles: pedido.detalles.map((detalle: ClientOrderDetail) => {
      const product = PRODUCTS.find((product) => product.id === detalle.productoId);

      return {
        cantidad: detalle.cantidad,
        subtotal: detalle.subtotal,
        producto: {
          id: product?.id ?? detalle.productoId,
          nombre: product?.nombre ?? "Producto no encontrado",
          descripcion: product?.descripcion ?? "",
          precio: product?.precio ?? 0,
          imagen: product?.imagen ?? "",
          disponible: product?.disponible ?? false,
          stock: product?.stock ?? 0,
          categoria: {
            id: 0,
            nombre: "Sin categoría",
            descripcion: "",
          },
        },
      };
    }),
  }));
}

function getAllOrders(): Order[] {
  const storedOrders = getStoredOrders();
  const clientOrders = getClientOrders();

  const ordersMap = new Map<number, Order>();

  // El orden permite que los pedidos modificados por el admin reemplacen a los originales.
  PEDIDOS.forEach((order) => {
    ordersMap.set(order.id, order);
  });

  clientOrders.forEach((order) => {
    ordersMap.set(order.id, order);
  });

  storedOrders.forEach((order) => {
    ordersMap.set(order.id, order);
  });

  return Array.from(ordersMap.values()).sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
}

function mapClientStatusToAdminStatus(status: string): EstadoPedido {
  const statusMap: Record<string, EstadoPedido> = {
    pending: "PENDIENTE",
    processing: "EN_PREPARACION",
    completed: "ENTREGADO",
    cancelled: "CANCELADO",
  };

  return statusMap[status] || "PENDIENTE";
}

function mapClientPaymentToAdminPayment(payment: string): FormaPago {
  const paymentMap: Record<string, FormaPago> = {
    efectivo: "EFECTIVO",
    tarjeta: "TARJETA",
    transferencia: "TRANSFERENCIA",
    Efectivo: "EFECTIVO",
    Tarjeta: "TARJETA",
    Transferencia: "TRANSFERENCIA",
  };

  return paymentMap[payment] || "EFECTIVO";
}

function updateClientOrderStatus(
  orderId: number,
  adminStatus: EstadoPedido
): void {
  const storedClientOrders = localStorage.getItem("pedidos");

  if (!storedClientOrders) return;

  const clientOrders = JSON.parse(storedClientOrders) as ClientOrder[];

  const updatedClientOrders = clientOrders.map((pedido: ClientOrder) => {
    if (pedido.id === orderId) {
      return {
        ...pedido,
        estado: mapAdminStatusToClientStatus(adminStatus),
      };
    }

    return pedido;
  });

  localStorage.setItem("pedidos", JSON.stringify(updatedClientOrders));
}

function mapAdminStatusToClientStatus(status: EstadoPedido): string {
  const statusMap: Partial<Record<EstadoPedido, string>> = {
    PENDIENTE: "pending",
    EN_PREPARACION: "processing",
    ENTREGADO: "completed",
    CANCELADO: "cancelled",
  };

  return statusMap[status] || "pending";
}