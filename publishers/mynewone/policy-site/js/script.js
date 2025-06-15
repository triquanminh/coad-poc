document.addEventListener("DOMContentLoaded", () => {
    const notifications = document.querySelector(".notifications")
    if (notifications) {
        notifications.addEventListener("click", () => {
            alert("Notifications feature coming soon!")
        })
    }

    const userProfile = document.querySelector(".user-profile")
    if (userProfile) {
        userProfile.addEventListener("click", () => {
            alert("User profile feature coming soon!")
        })
    }

    const createPostBtn = document.querySelector(".create-post-btn")
    if (createPostBtn) {
        createPostBtn.addEventListener("click", () => {
            alert("Create post feature coming soon!")
        })
    }

    const currentPage = window.location.pathname
    const sidebarLinks = document.querySelectorAll(".sidebar a")

    sidebarLinks.forEach((link) => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active")
        }
    })
})

