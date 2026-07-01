import { getCategories } from "../../../data/data";
import { logout, checkAuthUser } from "../../../utils/auth";

interface Category {
  id: number;
  nombre: string;
  descripcion: string;
  eliminado: boolean;
  createdAt: string;
}

const categoriesContainer = document.getElementById("categories-container");
const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement;

const newCategoryButton = document.getElementById("new-category");
const categoryModal = document.getElementById("category-modal");
const closeCategoryModal = document.getElementById("close-category-modal");

const categoryForm = document.getElementById("category-form") as HTMLFormElement;
const categoryNameInput = document.getElementById("category-name") as HTMLInputElement;
const categoryDescriptionInput = document.getElementById(
  "category-description"
) as HTMLTextAreaElement;

const categoryIdInput = document.getElementById("category-id") as HTMLInputElement;
const categoryModalTitle = document.getElementById(
  "category-modal-title"
) as HTMLHeadingElement;

buttonLogout?.addEventListener("click", () => {
  logout();
});

newCategoryButton?.addEventListener("click", () => {
  categoryForm.reset();
  categoryIdInput.value = "";
  categoryModalTitle.textContent = "Nueva categoría";
  categoryModal?.classList.remove("hidden");
});

closeCategoryModal?.addEventListener("click", () => {
  categoryModal?.classList.add("hidden");
});

categoryModal?.addEventListener("click", (event) => {
  if (event.target === categoryModal) {
    categoryModal.classList.add("hidden");
  }
});

categoryForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const nombre = categoryNameInput.value.trim();
  const descripcion = categoryDescriptionInput.value.trim();

  const editingId = categoryIdInput.value ? Number(categoryIdInput.value) : null;

  if (!nombre || !descripcion) {
    alert("Debe completar todos los campos.");
    return;
  }

  const storedCategories = getStoredCategories();
  const allCategories = getAllCategories();

  const exists = allCategories.some(
    (category: Category) =>
      category.nombre.toLowerCase() === nombre.toLowerCase() &&
      category.id !== editingId &&
      !category.eliminado
  );

  if (exists) {
    alert("Ya existe una categoría con ese nombre.");
    return;
  }

  if (editingId !== null) {
    const categoryToEdit = allCategories.find(
      (category: Category) => category.id === editingId
    );

    if (!categoryToEdit) {
      alert("No se encontró la categoría.");
      return;
    }

    const existsInStorage = storedCategories.some(
      (category: Category) => category.id === editingId
    );

    const updatedCategories = existsInStorage
      ? storedCategories.map((category: Category) => {
          if (category.id === editingId) {
            return {
              ...category,
              nombre,
              descripcion,
            };
          }

          return category;
        })
      : [
          ...storedCategories,
          {
            ...categoryToEdit,
            nombre,
            descripcion,
          },
        ];

    saveStoredCategories(updatedCategories);

    categoryForm.reset();
    categoryIdInput.value = "";
    categoryModal?.classList.add("hidden");

    location.reload();
    return;
  }

  const realIds = allCategories
    .map((category: Category) => Number(category.id))
    .filter((id: number) => Number.isFinite(id) && id < 1000);

  const nextId = realIds.length > 0 ? Math.max(...realIds) + 1 : 1;

  const newCategory: Category = {
    id: nextId,
    eliminado: false,
    createdAt: new Date().toISOString(),
    nombre,
    descripcion,
  };

  storedCategories.push(newCategory);
  saveStoredCategories(storedCategories);

  categoryForm.reset();
  categoryModal?.classList.add("hidden");

  location.reload();
});

checkAuthUser(
  "/src/pages/auth/login/login.html",
  "/src/pages/admin/categories/categories.html",
  "admin"
);

const categories = getAllCategories().filter(
  (category: Category) => !category.eliminado
);

if (categoriesContainer) {
  categoriesContainer.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        ${categories
          .map(
            (category: Category) => `
              <tr>
                <td>${category.id}</td>
                <td>${category.nombre}</td>
                <td class="category-description-cell">${category.descripcion}</td>
                <td class="actions">
                  <button class="edit-category" data-id="${category.id}">
                    Editar
                  </button>

                  <button class="delete-category" data-id="${category.id}">
                    Eliminar
                  </button>
                </td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

const editCategoryButtons = document.querySelectorAll(".edit-category");

editCategoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const categoryId = Number((button as HTMLButtonElement).dataset.id);

    const category = getAllCategories().find(
      (category: Category) => category.id === categoryId
    );

    if (!category) {
      alert("No se encontró la categoría.");
      return;
    }

    categoryIdInput.value = String(category.id);
    categoryNameInput.value = category.nombre;
    categoryDescriptionInput.value = category.descripcion;

    categoryModalTitle.textContent = "Editar categoría";
    categoryModal?.classList.remove("hidden");
  });
});

const deleteCategoryButtons = document.querySelectorAll(".delete-category");

deleteCategoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const categoryId = Number((button as HTMLButtonElement).dataset.id);

    const category = getAllCategories().find(
      (category: Category) => category.id === categoryId
    );

    if (!category) {
      alert("No se encontró la categoría.");
      return;
    }

    const confirmDelete = confirm(
      `¿Seguro que querés eliminar la categoría "${category.nombre}"?`
    );

    if (!confirmDelete) {
      return;
    }

    const storedCategories = getStoredCategories();

    const existsInStorage = storedCategories.some(
      (storedCategory: Category) => storedCategory.id === categoryId
    );

    const updatedCategories = existsInStorage
      ? storedCategories.map((storedCategory: Category) => {
          if (storedCategory.id === categoryId) {
            return {
              ...storedCategory,
              eliminado: true,
            };
          }

          return storedCategory;
        })
      : [
          ...storedCategories,
          {
            ...category,
            eliminado: true,
          },
        ];

    saveStoredCategories(updatedCategories);

    alert(`Categoría "${category.nombre}" eliminada correctamente.`);

    location.reload();
  });
});

function getStoredCategories(): Category[] {
  const storedCategories = localStorage.getItem("adminCategories");
  return storedCategories ? JSON.parse(storedCategories) as Category[] : [];
}

function saveStoredCategories(categories: Category[]) {
  localStorage.setItem("adminCategories", JSON.stringify(categories));
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