const BASE_URL = "http://localhost:3001/auth"; // Añadido /auth y puerto 3001

export async function registerUser(username, pin) { // Cambiado password por pin
    const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }) // Enviamos 'pin'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al registrar");
    return data;
}

export async function loginUser(username, pin) { // Cambiado password por pin
    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }) // Enviamos 'pin'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");
    return data; // { token, username }
}