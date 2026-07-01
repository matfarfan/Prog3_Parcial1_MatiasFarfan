import type { Rol } from "../../../types/Rol";
import { USERS } from "../../../data/data";


interface RegisteredUser {
  id: number;
  nombre: string;
  apellido: string;
  mail: string;
  password: string;
  rol: Rol;
}

const form = document.getElementById("register-form") as HTMLFormElement;
const inputName = document.getElementById("name") as HTMLInputElement;
const inputLastname = document.getElementById("lastname") as HTMLInputElement;
const inputEmail = document.getElementById("email") as HTMLInputElement;
const inputPassword = document.getElementById("password") as HTMLInputElement;

const getRegisteredUsers = (): RegisteredUser[] => {
  const users = localStorage.getItem("registeredUsers");

  if (!users) {
    return [];
  }

  return JSON.parse(users) as RegisteredUser[];
};

const saveRegisteredUsers = (users: RegisteredUser[]) => {
  localStorage.setItem("registeredUsers", JSON.stringify(users));
};

form.addEventListener("submit", (event: SubmitEvent) => {
  event.preventDefault();

  const name = inputName.value.trim();
  const lastname = inputLastname.value.trim();
  const email = inputEmail.value.trim();
  const password = inputPassword.value.trim();

  if (!name || !lastname || !email || !password) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  const registeredUsers = getRegisteredUsers();

  const emailAlreadyExists =
    USERS.some((user) => user.mail === email) ||
    registeredUsers.some((user) => user.mail === email);

  if (emailAlreadyExists) {
    alert("Ya existe un usuario registrado con ese email.");
    return;
  }

  const newUser: RegisteredUser = {
    id: Date.now(),
    nombre: name,
    apellido: lastname,
    mail: email,
    password,
    rol: "client",
  };

  saveRegisteredUsers([...registeredUsers, newUser]);

  alert("Usuario registrado correctamente. Ya podés iniciar sesión.");
  window.location.href = "../login/login.html";
});