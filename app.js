const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

const path = require("path");

app.use(bodyParser.json());
app.use(cors());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


mongoose.connect("mongodb+srv://verma:9977983547@cluster0.wgjjr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log("Connected to MongoDB successfully!");
  }).catch((error) => {
    console.log("Error connecting to MongoDB: ", error.message);
  });

const User = mongoose.model("User", new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    address: String, // Added address field
    cart: Array,
    orders: Array,
}));

const Restaurant = mongoose.model("Restaurant", new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    deliverypartnerpass: String,
    menu: [
        {
            name: String,
            price: Number,
            description: String,
        }
    ],
    orders: Array,
}));


const Admin = mongoose.model("Admin", new mongoose.Schema({
    email: String,
    password: String,
}));


const Order = mongoose.model("Order", new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true
    },
    items: [
      {
        name: String,
        quantity: Number,
        price: Number,
      }
    ],
    totalPrice: {
      type: Number,
      required: true
    },
    otp: {
	type: Number,
	required: true
    },
    status: {
      type: String,
      default: "Pending", // Can be Pending, Placed, Delivered, etc.
      enum: ["Pending", "Placed", "Delivered"],
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
  }));



  // Mock Restaurant Data
  const mockRestaurants = [
    {
      name: "Tasty Bites",
      email: "tastybites@example.com",
      password: "password123",
      menu: [
        { name: "Cheese Pizza", price: 349, description: "A delicious pizza topped with mozzarella cheese and a tangy tomato sauce." },
        { name: "Spaghetti Bolognese", price: 249, description: "A classic Italian pasta with a rich and savory meat sauce." },
        { name: "Caesar Salad", price: 179, description: "Crispy lettuce, creamy Caesar dressing, croutons, and parmesan cheese." },
        { name: "Chicken Burger", price: 299, description: "A grilled chicken patty with fresh lettuce, tomato, and a tangy mayo sauce." }
      ],
      orders: []
    },
    {
      name: "Delicious Diner",
      email: "deliciousdiner@example.com",
      password: "password456",
      menu: [
        { name: "Veggie Burger", price: 399, description: "A veggie patty with fresh lettuce, tomato, and avocado." },
        { name: "Grilled Chicken Sandwich", price: 429, description: "Grilled chicken with mayo, lettuce, and pickles." },
        { name: "Pasta Alfredo", price: 499, description: "Creamy Alfredo sauce with pasta and grilled chicken." },
        { name: "French Fries", price: 149, description: "Crispy golden fries with a side of ketchup." }
      ],
      orders: []
    }, {
      name: "Spicy Haven",
      email: "spicyhaven@example.com",
      password: "password789",
      menu: [
        { name: "Paneer Tikka", price: 199, description: "Cottage cheese marinated in a blend of Indian spices, grilled to perfection." },
        { name: "Butter Chicken", price: 379, description: "Tender chicken cooked in a rich, creamy tomato gravy." },
        { name: "Naan (Butter)", price: 79, description: "Soft, fluffy naan bread brushed with butter." },
        { name: "Biryani (Veg)", price: 249, description: "Fragrant rice layered with mixed vegetables and aromatic spices." }
      ],
      orders: []
    },
    {
      name: "The Burger Shack",
      email: "theburgershack@example.com",
      password: "password101",
      menu: [
        { name: "Classic Beef Burger", price: 399, description: "Juicy beef patty with fresh lettuce, tomato, cheese, and a special sauce." },
        { name: "BBQ Chicken Wings", price: 299, description: "Chicken wings marinated in a smoky BBQ sauce, served hot." },
        { name: "Veggie Wrap", price: 179, description: "A healthy wrap filled with fresh veggies and a creamy dressing." },
        { name: "Milkshake (Chocolate)", price: 159, description: "A creamy milkshake made with rich chocolate ice cream." }
      ],
      orders: []
    }
  ];
 

// Insert mock restaurant data
async function insertMockData() {
  try {
    for (const restaurantData of mockRestaurants) {
      const existingRestaurant = await Restaurant.findOne({ email: restaurantData.email });
      if (!existingRestaurant) {
        const newRestaurant = new Restaurant(restaurantData);
        await newRestaurant.save();
        console.log(`Mock restaurant '${restaurantData.name}' data inserted`);
      } else {
        console.log(`Restaurant '${restaurantData.name}' already exists in the database`);
      }
    }
  } catch (error) {
    console.error("Error inserting mock restaurant data:", error.message);
  }
}

// Call the insert function once the app connects to MongoDB
mongoose.connection.once("open", () => {
  insertMockData();
});



const Review = mongoose.model("Review", new mongoose.Schema(
  {
    userId: { type: String, required: false },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    orderId: { type: String, required: false },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: false },
  },
  { timestamps: true }
));



// ✅ Create a review
app.post("/api/reviews", async (req, res) => {
  try {
    const { userId, restaurantId, orderId, rating, reviewText } = req.body;
    console.log(userId)

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const newReview = new Review({ userId, restaurantId, orderId, rating, reviewText });
    console.log(newReview);
    await newReview.save();
    res.status(201).json({ message: "Review added successfully!", review: newReview });
  } catch (error) {
    res.status(500).json({ message: "Error adding review", error });
  }
});

// ✅ Get all reviews for a restaurant
app.get("/api/reviews/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const reviews = await Review.find({ restaurantId }).sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews", error });
  }
});

// ✅ Get all reviews from a specific user
app.get("/api/reviews/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user reviews", error });
  }
});

// User routes
app.post("/signup", async (req, res) => {
    const { name, email, password, address } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Save user with address
        const user = new User({
            name,
            email,
            password,
            address,
        });

        await user.save();
        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Error during signup" });
    }
});


app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }); // Find user by email

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (user.password !== password) { 
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // If login is successful, send structured response
        res.json({ 
            success: true, 
            user: { email: user.email, role: user.role } // Send only necessary user details
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get("/getproduct/:id", async(req, res) => {
    res.send("Product details for " + req.params.id);
});

app.post("/addtocart/:id", async(req, res) => {
    res.send("Added product " + req.params.id + " to cart");
});


app.get("/user/:email", async (req, res) => {
  try {
      const user = await User.findOne({ email: req.params.email });
      if (!user) return res.status(404).send("User not found");
      res.json({ address: user.address });
  } catch (error) {
      res.status(500).send("Error fetching user data: " + error.message);
  }
});


app.post("/placeorder/:id", async (req, res) => {
  try {
    const { userEmail, items } = req.body; // Get userEmail from request

    const user = await User.findOne({ email: userEmail }); // Find user by email
    if (!user) return res.status(404).send("User not found");

    let totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);
    let otp = Math.floor(1000 + Math.random() * 9000);

    const newOrder = new Order({
      userId: user._id, // Save userId internally
      restaurantId: req.params.id,
      items,
      totalPrice,
      otp,
      status: "Pending",
    });

    await newOrder.save();
    res.status(201).send("Order placed successfully!");
  } catch (error) {
    res.status(500).send("Error placing order: " + error.message);
  }
});



// Restaurant Routes
app.post("/restaurant/signup", async(req, res) => {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();
    res.send("Restaurant registered");
});

app.post("/restaurant/login", async(req, res) => {
    const restaurant = await Restaurant.findOne(req.body);
    if (restaurant) res.send("Login successful");
    else res.send("Invalid credentials");
});

app.post("/cancelorder/:id", async (req, res) => {
  try {
      const order = await Order.findById(req.params.id);
      
      if (!order) return res.status(404).send("Order not found");

      if (order.status === "Pending") {
          await Order.findByIdAndDelete(req.params.id);
          return res.send("Order cancelled successfully");
      }

      res.send("Order is already processed and cannot be cancelled");
  } catch (error) {
      res.status(500).send("Error cancelling order: " + error.message);
  }
});

// View Orders
app.get("/vieworders", async (req, res) => {
  try {
      const restaurantId = req.query.restaurantId; // ✅ Use query instead of body
      if (!restaurantId) return res.status(400).send("Restaurant ID is required");

      const orders = await Order.find({ restaurantId }).populate("userId", "name email");
      res.json(orders);
  } catch (error) {
      res.status(500).send("Error fetching orders: " + error.message);
  }
});


  app.get("/vieworders/:userEmail", async (req, res) => {
    try {
      const user = await User.findOne({ email: req.params.userEmail }); // Find user by email
      if (!user) return res.status(404).send("User not found");
  
      const orders = await Order.find({ userId: user._id }) // Fetch orders using found userId
        .populate("restaurantId", "name")
        .populate("userId", "name email");
  
      res.json(orders);
    } catch (error) {
      res.status(500).send("Error fetching orders: " + error.message);
    }
  });
  
  

  // Mark Order as Placed
app.post("/delivered/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
  
      const order = await Order.findById(orderId);
  
      if (order) {
        order.status = "Placed"; // Mark as placed
        await order.save();
        res.send(`Order ${orderId} marked as placed`);
      } else {
        res.status(404).send("Order not found");
      }
    } catch (error) {
      res.status(500).send("Error updating order status: " + error.message);
    }
  });
  
  

// Admin Routes
app.post("/admin/signup", async(req, res) => {
    const admin = new Admin(req.body);
    await admin.save();
    res.send("Admin registered");
});

app.post("/admin/login", async(req, res) => {
    const admin = await Admin.findOne(req.body);
    if (admin) res.send("Login successful");
    else res.send("Invalid credentials");
});

app.post("/addrestaurants", async(req, res) => {
    res.send("New restaurant added");
});

app.get("/viewrestaurants", async(req, res) => {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
});



// Food Routes
app.get("/browse", async (req, res) => {
    try {
        const restaurants = await Restaurant.find();  // Find all restaurants
        res.json(restaurants);  // Send restaurants with menus as response
    } catch (error) {
        res.status(500).send("Error fetching restaurants: " + error.message);
    }
});


app.post("/add", async(req, res) => {
    res.send("Food item added by restaurant");
});

app.get("/search/:params", async(req, res) => {
    res.send("Search results for: " + req.params.params);
});


// Cart functionality


app.post("/addtocart/:productId", async (req, res) => {
  const { productId } = req.params;  // Product ID from URL
  const { quantity, userEmail } = req.body;  // Quantity and user email from request body
  
  try {
      // Find the user by email
      const user = await User.findOne({ email: userEmail });
      if (!user) return res.status(404).send("User not found");

      // Check if product is already in the cart
      const existingProductIndex = user.cart.findIndex(item => item.productId === productId);

      if (existingProductIndex !== -1) {
          // If product is already in cart, update quantity
          user.cart[existingProductIndex].quantity += quantity;
      } else {
          // If product is not in cart, add new item
          user.cart.push({ productId, quantity });
      }

      // Save the updated cart
      await user.save();
      console.log("Product added to cart");
      res.send("Product added to cart");
  } catch (error) {
      res.status(500).send("Error adding product to cart: " + error.message);
  }
});


app.get("/viewcart", async (req, res) => {
  const userEmail = req.query.userEmail;  // User email from query parameter
  
  try {
      // Find the user by email
      const user = await User.findOne({ email: userEmail });
      if (!user) return res.status(404).send("User not found");

      // Send user's cart
      res.json(user.cart);
  } catch (error) {
      res.status(500).send("Error fetching cart: " + error.message);
  }
});


// Restaurant Routes APIs
// View Orders
app.get("/restaurant/orders/:restaurantId", async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        const orders = await Order.find({ restaurantId: restaurant._id });
        const totalIncome = orders.reduce((sum, order) => sum + order.totalPrice, 0);
        const deliveryIncome = orders.length * 15;
        res.json({ orders, totalIncome, deliveryIncome });
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});

// View Menu
app.get("/restaurant/menu/:restaurantId", async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        res.json(restaurant.menu);
    } catch (error) {
        res.status(500).json({ message: "Error fetching menu" });
    }
});

// Add Menu Item
app.post("/restaurant/add-menu", async (req, res) => {
    const { restaurantId, name, price, description } = req.body;
    if (!restaurantId || !name || !price || !description) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        restaurant.menu.push({ name, price, description });
        await restaurant.save();
        res.json({ message: "Menu item added successfully", menu: restaurant.menu });
    } catch (error) {
        res.status(500).json({ message: "Error adding menu item" });
    }
});

const mockAdmin = { email: "admin@new.com", password: "123456" };


// Admin APIs

app.get("/api/restaurants", async (req, res) => {
  const restaurants = await Restaurant.find();
  res.json(restaurants);
});

app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.get("/api/orders", async (req, res) => {
  const orders = await Order.find().populate("restaurantId");
  res.json(orders);
});

app.get("/api/totals", async (req, res) => {
  const orders = await Order.find();
  const totalIncome = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const serviceCharge = orders.length * 15;
  const deliveryCharge = orders.length * 15;
  res.json({ totalIncome, serviceCharge, deliveryCharge });
});

app.post("/api/add-restaurant", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({ email });
    if (existingRestaurant) {
      return res.status(400).json({ error: "Restaurant already exists" });
    }

    // Create and save new restaurant
    const newRestaurant = await Restaurant.create({ 
      name, 
      email, 
      password, 
      menu: [], 
      orders: [] 
    });

    res.status(201).json(newRestaurant);
  } catch (error) {
    console.error("Error adding restaurant:", error);
    res.status(500).json({ error: "Error adding restaurant" });
  }
});


app.delete("/api/remove-restaurant/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRestaurant = await Restaurant.findByIdAndDelete(id);
        if (!deletedRestaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.json({ message: "Restaurant removed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

app.delete("/restaurant/remove-menu", async (req, res) => {
    const { restaurantId, itemId } = req.body;
    try {
        await Restaurant.findByIdAndUpdate(restaurantId, {
            $pull: { menu: { _id: itemId } }
        });
        res.status(200).json({ message: "Menu item removed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error removing menu item" });
    }
});


// Login Pages
app.get("/login/deliverypartner", (req, res) => {
  res.render("login-delivery", { role: "Delivery Partner" });
});

app.get("/login/restaurant", (req, res) => {
  res.render("login-res", { role: "Restaurant" });
});

app.get("/login/admin", (req, res) => {
  res.render("login", { role: "Admin" });
});

// Login Authentication
app.post("/login/admin", (req, res) => {
  const { email, password } = req.body;
  if (email === mockAdmin.email && password === mockAdmin.password) {
    return res.json({ success: true, dashboard: "/dashboard/admin" });
  }
  res.json({ success: false, message: "Invalid credentials" });
});

app.post("/login/restaurant", async (req, res) => {
  const { email, password } = req.body;
  const user = await Restaurant.findOne({ email, password });
  if (user) {
    return res.json({ success: true, dashboard: "/dashboard/restaurant" });
  }
  res.json({ success: false, message: "Invalid credentials" });
});

app.post("/login/deliverypartner", async (req, res) => {
  const { email, password } = req.body;
  const deliverypartnerpass = password;
  const user = await Restaurant.findOne({ email, deliverypartnerpass });

  if (user) {
    return res.json({ 
      success: true, 
      dashboard: "/dashboard/delivery", 
      restaurantId: user._id 
    });
  }
  res.json({ success: false, message: "Invalid credentials" });
});



// APIs for dashboards

app.get("/api/delivery/orders/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Populate the userId field to get user details (name and address)
    const orders = await Order.find({ restaurantId }).populate("userId", "name address");
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
});


app.post("/api/delivery/update-status", async (req, res) => {
  const { orderId, otp, newStatus } = req.body;
  console.log(otp);
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    console.log(order.otp);
    if (order.otp != otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    order.status = newStatus;
    order.otp = 0;
    await order.save();

    res.json({ success: true, message: "Order status updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating order status" });
  }
});

// Delivery partner APIs

app.post("/restaurant/update-delivery-password", async (req, res) => {
    const { restaurantId, newPassword } = req.body;
    try {
        await Restaurant.findByIdAndUpdate(restaurantId, { deliverypartnerpass: newPassword });
        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating password" });
    }
});





// Dashboard Pages
app.get("/dashboard/admin", (req, res) => {
  res.render("dashboard", { role: "Admin" });
});

app.get("/dashboard/delivery", (req, res) => {
  res.render("dashboard-delivery", { role: "Delivery Partner" });
});

app.get("/dashboard/restaurant", async (req, res) => {
    try {
        // Extract email (token) from query params
        const email = req.query.id;
	console.log(email);
        if (!email) {
            return res.redirect("/login/restaurant");
        }

        // Find the restaurant based on the email
        const restaurant = await Restaurant.findOne({ email });

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        // Render the delivery dashboard with the restaurant data
        res.render("dashboard-res", { role: "Restaurant", restaurant });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});



app.get("/", (req, res) => {
  res.send("<h1><center>You may have opened this url by mistake... There's nothing here....</center></h1>");
});



app.listen(3000, () => {
    console.log("Server running on port 3000");
});