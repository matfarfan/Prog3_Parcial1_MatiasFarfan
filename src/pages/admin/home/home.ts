import { checkAuthUser, logout } from "../../../utils/auth";
import { PRODUCTS, getCategories } from "../../../data/data";
import { getAllOrders } from "../../../utils/pedidoService";

interface Category {
  id: number;
  nombre: string;
  descripcion: string;
  eliminado: boolean;
  createdAt: string;
}

interface Product {
  id: number;
  eliminado: boolean;
  createdAt: string;
  nombre: string;
  precio: number;
  descripcion: string;
  stock: number;
  imagen: string;
  disponible: boolean;
  categorias: Category[];
}

const buttonLogout = document.getElementById(
  "logoutButton"
) as HTMLButtonElement;

buttonLogout?.addEventListener("click", () => {
  logout();
});

const initPage = () => {
  checkAuthUser(
    "/src/pages/auth/login/login.html",
    "/src/pages/admin/home/home.html",
    "admin"
  );
};

initPage();

const totalCategories = document.getElementById("total-categories");
const totalProducts = document.getElementById("total-products");
const totalOrders = document.getElementById("total-orders");
const availableProducts = document.getElementById("available-products");
const totalIncome = document.getElementById("total-income");
const pendingOrders = document.getElementById("pending-orders");
const processingOrders = document.getElementById("processing-orders");
const completedOrders = document.getElementById("completed-orders");

const categories = getAllCategories().filter(
  (category: Category) => !category.eliminado
);
const pedidos = getAllOrders();

const products = getAllProducts().filter(
  (product: Product) => !product.eliminado
);

const productosDisponibles = products.filter(
  (product: Product) => product.disponible
);

if (totalCategories) {
  totalCategories.textContent = String(categories.length);
}

if (totalProducts) {
  totalProducts.textContent = String(products.length);
}

if (totalOrders) {
  totalOrders.textContent = String(pedidos.length);
}

if (availableProducts) {
  availableProducts.textContent = String(productosDisponibles.length);
}

const pedidosPendientes = pedidos.filter((pedido) => {
  const estado = String(pedido.estado).toLowerCase();
  return estado === "pending" || estado === "pendiente";
});

const pedidosEnPreparacion = pedidos.filter((pedido) => {
  const estado = String(pedido.estado).toLowerCase();
  return estado === "processing" || estado === "en_preparacion";
});

const pedidosCompletados = pedidos.filter((pedido) => {
  const estado = String(pedido.estado).toLowerCase();
  return estado === "completed" || estado === "entregado";
});

const ingresosTotales = pedidosCompletados.reduce(
  (total, pedido) => total + Number(pedido.total),
  0
);

if (totalIncome) {
  totalIncome.textContent = `$${ingresosTotales}`;
}

if (pendingOrders) {
  pendingOrders.textContent = String(pedidosPendientes.length);
}

if (processingOrders) {
  processingOrders.textContent = String(pedidosEnPreparacion.length);
}

if (completedOrders) {
  completedOrders.textContent = String(pedidosCompletados.length);
}

function getStoredCategories(): Category[] {
  const storedCategories = localStorage.getItem("adminCategories");
  return storedCategories ? (JSON.parse(storedCategories) as Category[]) : [];
}

function getAllCategories(): Category[] {
  const dataCategories = getCategories() as Category[];
  const storedCategories = getStoredCategories();

  const mergedCategories = dataCategories.map((dataCategory: Category) => {
    const editedCategory = storedCategories.find(
      (storedCategory: Category) => storedCategory.id === dataCategory.id
    );

    return editedCategory ? editedCategory : dataCategory;
  });

  const newCategories = storedCategories.filter(
    (storedCategory: Category) =>
      !dataCategories.some(
        (dataCategory: Category) => dataCategory.id === storedCategory.id
      )
  );

  return [...mergedCategories, ...newCategories];
}

function getStoredProducts(): Product[] {
  const storedProducts = localStorage.getItem("adminProducts");
  return storedProducts ? (JSON.parse(storedProducts) as Product[]) : [];
}

function getAllProducts(): Product[] {
  const dataProducts = PRODUCTS as Product[];
  const storedProducts = getStoredProducts();

  const mergedProducts = dataProducts.map((dataProduct: Product) => {
    const editedProduct = storedProducts.find(
      (storedProduct: Product) => storedProduct.id === dataProduct.id
    );

    return editedProduct ? editedProduct : dataProduct;
  });

  const newProducts = storedProducts.filter(
    (storedProduct: Product) =>
      !dataProducts.some(
        (dataProduct: Product) => dataProduct.id === storedProduct.id
      )
  );

  return [...mergedProducts, ...newProducts];
}