import { useEffect, useState } from "react";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from "recharts";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const COLORS = {
    Income: "#16a34a",
    Expense: "#dc2626"
};

function Dashboard() {
    const { user } = useAuth();

    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [summaryResponse, transactionsResponse] =
                    await Promise.all([
                        api.get("/transactions/summary"),
                        api.get(
                            "/transactions?page=0&size=5&sortBy=transactionDate&direction=desc"
                        )
                    ]);

                // Summary data
                setSummary(summaryResponse.data || null);

                // Transactions data
                const data = transactionsResponse.data;

                if (Array.isArray(data)) {
                    setTransactions(data);
                } else if (Array.isArray(data?.transactions)) {
                    setTransactions(data.transactions);
                } else if (Array.isArray(data?.content)) {
                    setTransactions(data.content);
                } else {
                    setTransactions([]);
                }
            } catch (err) {
                console.error("Dashboard loading error:", err);

                setError("Unable to load dashboard data.");
                setTransactions([]);
                setSummary(null);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    // Loading screen
    if (loading) {
        return (
            <>
                <Navbar />

                <div className="dashboard-loading">
                    Loading dashboard...
                </div>
            </>
        );
    }

    // Chart data
    const chartData = [
        {
            name: "Income",
            value: Number(summary?.totalIncome || 0)
        },
        {
            name: "Expense",
            value: Number(summary?.totalExpense || 0)
        }
    ];

    return (
        <div>
            <Navbar />

            <main className="dashboard-container">

                {/* Dashboard Header */}
                <div className="dashboard-header">
                    <div>
                        <h1>
                            Welcome, {user?.name || "User"}
                        </h1>

                        <p>
                            Here's your financial overview
                        </p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Summary Cards */}
                {summary && (
                    <div className="summary-grid">

                        <div className="summary-card">
                            <p>Total Balance</p>

                            <h2>
                                ₹
                                {Number(
                                    summary.balance || 0
                                ).toFixed(2)}
                            </h2>
                        </div>

                        <div className="summary-card">
                            <p>Total Income</p>

                            <h2>
                                ₹
                                {Number(
                                    summary.totalIncome || 0
                                ).toFixed(2)}
                            </h2>
                        </div>

                        <div className="summary-card">
                            <p>Total Expense</p>

                            <h2>
                                ₹
                                {Number(
                                    summary.totalExpense || 0
                                ).toFixed(2)}
                            </h2>
                        </div>

                    </div>
                )}

                {/* Dashboard Grid */}
                <div className="dashboard-grid">

                    {/* Income vs Expense Card */}
                    <div className="dashboard-card">

                        <h2>
                            Income vs Expense
                        </h2>

                        <div className="chart-container">

                            <div className="expense-chart">

                                <div className="chart-wrapper">

                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>

                                            <Pie
                                                data={chartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius="70%"
                                            >
                                                {chartData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                COLORS[
                                                                    entry.name
                                                                ]
                                                            }
                                                        />
                                                    )
                                                )}
                                            </Pie>

                                            <Tooltip />

                                        </PieChart>
                                    </ResponsiveContainer>

                                </div>

                                {/* Chart Legend */}
                                <div className="chart-legend">

                                    <div className="legend-item">
                                        <span className="legend-color expense-color"></span>

                                        <span>
                                            Expense
                                        </span>
                                    </div>

                                    <div className="legend-item">
                                        <span className="legend-color income-color"></span>

                                        <span>
                                            Income
                                        </span>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* Recent Transactions Card */}
                    <div className="dashboard-card">

                        <div className="card-header">
                            <h2>
                                Recent Transactions
                            </h2>
                        </div>

                        {transactions.length === 0 ? (

                            <p className="empty-message">
                                No transactions found.
                            </p>

                        ) : (

                            <div className="recent-list">

                                {transactions.map(
                                    (transaction) => (

                                        <div
                                            className="recent-item"
                                            key={transaction.id}
                                        >

                                            <div>
                                                <strong>
                                                    {transaction.category}
                                                </strong>

                                                <p>
                                                    {transaction.description ||
                                                        "No description"}
                                                </p>

                                                <small>
                                                    {transaction.transactionDate}
                                                </small>
                                            </div>

                                            <span
                                                className={
                                                    transaction.type ===
                                                    "INCOME"
                                                        ? "income-text"
                                                        : "expense-text"
                                                }
                                            >
                                                {transaction.type ===
                                                "INCOME"
                                                    ? "+"
                                                    : "-"}

                                                ₹
                                                {Number(
                                                    transaction.amount || 0
                                                ).toFixed(2)}
                                            </span>

                                        </div>
                                    )
                                )}

                            </div>

                        )}

                    </div>

                </div>

            </main>
        </div>
    );
}

export default Dashboard;