const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginEmail = document.querySelector("#login-email");
const loginPass = document.querySelector("#login-password");
const registerName = document.querySelector("#register-name");
const registerEmail = document.querySelector("#register-email");
const registerPass = document.querySelector("#register-password");
const registerPass2 = document.querySelector("#register-password2");
const accessToken = localStorage.getItem("access_token");
const loginButton = document.querySelector("#login-button")
const registerButton = document.querySelector("#register-button")
const baseURL = `https://tech-todo-backend.herokuapp.com`;
async function fetchData(url, options, append = 1) {
    let finalURL;
    if (append == 0) {
        finalURL = url;
    } else {
        finalURL = baseURL + url;
    }
    let res = await fetch(finalURL, options);
    try {
        let json = await res.json();
        if (json.message == "ACCESS_DENIED") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("access_role");
            localStorage.setItem("multi_login", 1);
            window.location.href = `http://${window.location.host}/index.html`;
        }
        return json;
    } catch {
        return res;
    }
}

loginForm.addEventListener('submit', (e) => {
    login(e)
})
registerForm.addEventListener('submit', (e) => {
    register(e)
})

function login(e) {
    e.preventDefault();
    loginButton.innerHTML = `<img src="./assets/images/loading-pulse.svg" class="loading-pulse-xs" alt="" srcset="">`
    let email = loginEmail.value;
    let password = loginPass.value;
    fetchData('/auth/login', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    }).then(res => {
        if (res.status == "OKAY") {
            let token = res.data.token;
            let name = res.data.name;
            let email = res.data.email;
            let id = res.data.id;
            localStorage.setItem('access_token', token);
            localStorage.setItem('user_name', name);
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_id', id);
            window.location.href = 'index.html'
        } else {
            loginButton.innerHTML = `Login`
            alert("something went wrong")
        }
    })
}

function register(e) {
    alert("Feature removed by developers.")
        // e.preventDefault();
        // let name = registerName.value
        // let email = registerEmail.value;
        // let password = registerPass.value;
        // let password2 = registerPass2.value;
        // if (password !== password2) {
        //     alert("Password doesn't match");
        //     return;
        // }
        // registerButton.innerHTML = `<img src="./assets/images/loading-pulse.svg" class="loading-pulse-xs" alt="" srcset="">`
        // fetchData('/auth/register', {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json"
        //     },
        //     body: JSON.stringify({
        //         email,
        //         password,
        //         password,
        //         name
        //     })
        // }).then(res => {
        //     registerButton.innerHTML = `Register`
        //     if (res.status == "OKAY") {

    //         alert("Registered successfully.")
    //     } else {
    //         console.log("something went wrong")
    //     }
    // })
}