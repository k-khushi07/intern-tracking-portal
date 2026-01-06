export const initializeAdmin = () => {
  try {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    
    const adminExists = users.find(u => u.role === "admin");
    
    if (!adminExists) {
      const adminUser = {
        id: "admin-1",
        role: "admin",
        fullName: "System Administrator",
        email: "admin@portal.com",
        password: "ADMIN1234",
        phone: "9999999999",
        createdAt: new Date().toISOString(),
        disabled: false,
        approved: true,
      };
      
      users.push(adminUser);
      localStorage.setItem("users", JSON.stringify(users));
      console.log("✅ Admin account initialized");
    }
  } catch (err) {
    console.error("Error initializing admin:", err);
  }
};