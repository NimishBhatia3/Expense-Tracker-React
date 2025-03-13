import React, { useState, useEffect } from "react";
import Chart from "chart.js/auto";
import { saveAs } from "file-saver";

// Interface defining the structure of an expense
interface Expense {
  id: string; // Unique identifier for the expense
  description: string; // Description of the expense
  amount: number; // Expense amount
  category: string; // Expense category
}

// Array of predefined categories
const categories = ["Food", "Transport", "Entertainment", "Bills", "Other"];

const ExpenseTracker: React.FC = () => {
  // List of expenses, retrieved from localStorage if available
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const savedExpenses = localStorage.getItem("expenses");
    return savedExpenses ? JSON.parse(savedExpenses) : [];
  });

  // Input fields for adding a new expense
  const [description, setDescription] = useState(""); // Stores description input
  const [amount, setAmount] = useState(""); // Stores amount input
  const [category, setCategory] = useState("Food"); // Default category selection

  // Budget and income values retrieved from localStorage
  const [budget, setBudget] = useState(() => localStorage.getItem("budget") || "");
  const [income, setIncome] = useState(() => localStorage.getItem("income") || "");

  // Currency selection and exchange rates
  const [currency, setCurrency] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  // Dark mode setting, retrieved from localStorage
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  // Save expenses to localStorage when updated
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  // Save budget to localStorage when updated
  useEffect(() => {
    localStorage.setItem("budget", budget);
  }, [budget]);

  // Save income to localStorage when updated
  useEffect(() => {
    localStorage.setItem("income", income);
  }, [income]);

  // Save dark mode preference to localStorage when updated
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);  

  // Fetch exchange rates when the component mounts
  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then(res => res.json())
      .then(data => setExchangeRates(data.rates));
  }, []);

  // Adds a new expense to the list
  const addExpense = () => {
    if (!description.trim() || !amount) return;
    const newExpense: Expense = {
      id: Date.now().toString(),
      description,
      amount: parseFloat(amount),
      category,
    };
    setExpenses([...expenses, newExpense]);
    setDescription("");
    setAmount("");
  };

  // Deletes an expense from the list
  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  // Calculates total expenses
  const totalAmount = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  
  // Calculates remaining balance
  const balance = (parseFloat(income) || 0) - totalAmount;
  
  // Converts total amount to selected currency
  const convertedAmount = ((totalAmount || 0) * (exchangeRates[currency] || 1)).toFixed(2);

  // Exports expense data to a CSV file
  const exportToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Description,Amount,Category\n" +
      expenses.map(e => `${e.description},${e.amount},${e.category}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    saveAs(encodedUri, "expenses.csv");
  };

  // Generates a pie chart displaying expense distribution
  useEffect(() => {
    const ctx = document.getElementById("expenseChart") as HTMLCanvasElement;
    if (ctx) {
      const existingChart = Chart.getChart(ctx);
      if (existingChart) existingChart.destroy();

      new Chart(ctx, {
        type: "pie",
        data: {
          labels: categories,
          datasets: [{
            data: categories.map(cat => {
              return expenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0);
            }),
            backgroundColor: ["#4CAF50", "#FFC107", "#03A9F4", "#E91E63", "#9C27B0"]
          }]
        }
      });
    }
  }, [expenses]);

  // Clears all data, resetting the tracker
  const clearData = () => {
    localStorage.removeItem("expenses");
    localStorage.removeItem("budget");
    localStorage.removeItem("income");
    setExpenses([]);
    setBudget("");
    setIncome("");
  };

  return (
    <div className="container">
      <h1>💰 Expense Tracker</h1>

      {/* Button to toggle dark mode */}
      <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
      </button>

      {/* Displays current month */}
      <h3>Expense Tracker for {new Date().toLocaleString("default", { month: "long", year: "numeric" })}</h3>

      {/* Input fields for budget and income */}
      <h3>Income & Budget:</h3>
      <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="Set Income" />
      <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Set Budget" />

      {/* Button to clear all data */}
      <button className="clear-button" onClick={clearData} style={{ backgroundColor: "red", color: "white", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer" }}>
        🗑 Clear Data
      </button>

      {/* Budget progress bar */}
      <h3>Budget Progress:</h3>
      <p>Budget: {currency} {budget || "0"}</p>
      <progress value={totalAmount} max={budget || "0"}></progress>
      <p>Remaining: {currency} {(parseFloat(budget) || 0 - totalAmount).toFixed(2)}</p>

      {/* Dropdown to select currency */}
      <h3>Select Currency:</h3>
      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
        {Object.keys(exchangeRates).map(curr => (
          <option key={curr} value={curr}>{curr}</option>
        ))}
      </select>

      {/* Input fields for adding a new expense */}
      <div className="input-group">
        <input type="text" placeholder="Expense description..." value={description} onChange={(e) => setDescription(e.target.value)} />
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Button to add an expense */}
      <button onClick={addExpense}>Add Expense</button>

      {/* List of expenses */}
      <div className="expense-list">
        {expenses.map((expense) => (
          <div key={expense.id} className="expense-item">
            <span>{expense.description} - {currency} {expense.amount.toFixed(2)} ({expense.category})</span>
            <button 
              onClick={() => deleteExpense(expense.id)} 
              style={{ backgroundColor: "red", color: "white", padding: "5px", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
              ✖
            </button>
          </div>
        ))}
      </div>

      {/* Displays total expenses and balance */}
      <p className="total">Total: {currency} {convertedAmount}</p>
      <p>💰 Balance: {currency} {balance.toFixed(2)}</p>

      {/* Button to export expenses to CSV */}
      <button onClick={exportToCSV}>📤 Export CSV</button>

      {/* Canvas for displaying the expense pie chart */}
      <canvas id="expenseChart" width="400" height="400"></canvas>
    </div>
  );
};

export default ExpenseTracker;
