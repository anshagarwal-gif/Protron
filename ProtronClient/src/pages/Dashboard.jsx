import React, { useState, useEffect } from 'react';
import { AgCharts } from 'ag-charts-react';
import { useSession } from '../Context/SessionContext';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        summaryStats: { totalProjects: 0, openProjects: 0, wipProjects: 0, closedProjects: 0 },
        projectStatusPie: [],
        projectTeamCounts: [],
        projectValues: [],
        invoiceTrends: [],
        poVsInvoice: []
    });
    const [loading, setLoading] = useState({
        summaryStats: true,
        projectStatusPie: true,
        projectTeamCounts: true,
        projectValues: true,
        invoiceTrends: true,
        poVsInvoice: true
    });
    const { sessionData } = useSession();

    useEffect(() => {
        const parseAmount = (val) => typeof val === 'string' ? parseFloat(val) : val;

        // Helper to update loading state
        const setLoaded = (key) => setLoading(prev => ({ ...prev, [key]: false }));

        fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/summary-stats`, {
            headers: { "Authorization": `${sessionData.token}` }
        })
            .then(res => res.json())
            .then(summaryStats => {
                setDashboardData(prev => ({ ...prev, summaryStats }));
                setLoaded('summaryStats');
            });

        fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/project-status-pie`, {
            headers: { "Authorization": `${sessionData.token}` }
        })
            .then(res => res.json())
            .then(projectStatusPie => {
                setDashboardData(prev => ({
                    ...prev,
                    projectStatusPie: projectStatusPie.map(d => ({ status: d.status, count: d.count }))
                }));
                setLoaded('projectStatusPie');
            });

        fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/project-team-count`, {
            headers: { "Authorization": `${sessionData.token}` }
        })
            .then(res => res.json())
            .then(projectTeamCounts => {
                setDashboardData(prev => ({
                    ...prev,
                    projectTeamCounts: projectTeamCounts.map(d => ({
                        projectName: d.projectName,
                        teamCount: d.memberCount
                    }))
                }));
                setLoaded('projectTeamCounts');
            });

        fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/project-values`, {
            headers: { "Authorization": `${sessionData.token}` }
        })
            .then(res => res.json())
            .then(projectValues => {
                setDashboardData(prev => ({
                    ...prev,
                    projectValues: projectValues.map(d => ({
                        projectName: d.projectName,
                        value: parseAmount(d.projectCost)
                    }))
                }));
                setLoaded('projectValues');
            });

        fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/monthly-invoice-trend`, {
            headers: { "Authorization": `${sessionData.token}` }
        })
            .then(res => res.json())
            .then(invoiceTrends => {
                setDashboardData(prev => ({
                    ...prev,
                    invoiceTrends: invoiceTrends.map(d => ({
                        month: d.month,
                        amount: parseAmount(d.totalAmount)
                    }))
                }));
                setLoaded('invoiceTrends');
            });

        fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/po-vs-invoice`, {
            headers: { "Authorization": `${sessionData.token}` }
        })
            .then(res => res.json())
            .then(poVsInvoice => {
                setDashboardData(prev => ({
                    ...prev,
                    poVsInvoice: poVsInvoice.map(d => ({
                        name: d.projectName,
                        poAmount: parseAmount(d.poAmount),
                        invoicedAmount: parseAmount(d.invoiceAmount)
                    }))
                }));
                setLoaded('poVsInvoice');
            });
    }, [sessionData.token]);

    // Chart configurations
    const pieChartOptions = {
        data: dashboardData.projectStatusPie,
        series: [
            {
                type: "pie",
                angleKey: "count",
                categoryKey: "status",         // Used for labels on the chart
                legendItemKey: "status"        // ✅ Used for color + text in the legend
            }
        ],
        title: {
            text: "Projects by Status",
        }
    };


    const teamCountBarOptions = {
        data: dashboardData.projectTeamCounts.slice(0, 10),
        series: [{
            type: 'bar',
            xKey: 'projectName',
            yKey: 'teamCount',
            fill: '#8b5cf6',
            stroke: '#7c3aed',
            strokeWidth: 1
        }],
        axes: [
            {
                type: 'category',
                position: 'bottom',
                label: {
                    rotation: -45,
                    fontSize: 11
                }
            },
            {
                type: 'number',
                position: 'left',
                title: { text: 'Team Members' }
            }
        ],
        title: {
            text: 'Projects vs Team Member Count',
            fontSize: 18,
            fontWeight: 'bold'
        },
        background: {
            fill: '#ffffff'
        }
    };

    const projectValueBarOptions = {
        data: dashboardData.projectValues.slice(0, 10),
        series: [{
            type: 'bar',
            xKey: 'projectName',
            yKey: 'value',
            fill: '#ef4444',
            stroke: '#dc2626',
            strokeWidth: 1,
            label: {
                enabled: true,
                formatter: ({ value }) => `$${(value / 1000)}k`
            }
        }],
        axes: [
            {
                type: 'category',
                position: 'bottom',
                label: {
                    rotation: -45,
                    fontSize: 11
                }
            },
            {
                type: 'number',
                position: 'left',
                title: { text: 'Value ($)' },
                label: {
                    formatter: ({ value }) => `$${(value / 1000)}k`
                }
            }
        ],
        title: {
            text: 'Project Name with Project Value',
            fontSize: 18,
            fontWeight: 'bold'
        },
        background: {
            fill: '#ffffff'
        }
    };

    const invoiceTrendLineOptions = {
        data: dashboardData.invoiceTrends,
        series: [{
            type: 'line',
            xKey: 'month',
            yKey: 'amount',
            stroke: '#06b6d4',
            strokeWidth: 4,
            marker: {
                fill: '#0891b2',
                stroke: '#ffffff',
                strokeWidth: 2,
                size: 8
            }
        }],
        axes: [
            {
                type: 'category',
                position: 'bottom'
            },
            {
                type: 'number',
                position: 'left',
                title: { text: 'Amount ($)' },
                label: {
                    formatter: ({ value }) => `$${(value / 1000)}k`
                }
            }
        ],
        title: {
            text: 'Monthly Invoicing Trend',
            fontSize: 18,
            fontWeight: 'bold'
        },
        background: {
            fill: '#ffffff'
        }
    };

    const poVsInvoiceBarOptions = {
        data: dashboardData.poVsInvoice.slice(0, 10),
        series: [
            {
                type: 'bar',
                xKey: 'name',
                yKey: 'poAmount',
                fill: '#f97316',
                stroke: '#ea580c',
                strokeWidth: 1,
                yName: 'PO Amount'
            },
            {
                type: 'bar',
                xKey: 'name',
                yKey: 'invoicedAmount',
                fill: '#84cc16',
                stroke: '#65a30d',
                strokeWidth: 1,
                yName: 'Invoiced Amount'
            }
        ],
        axes: [
            {
                type: 'category',
                position: 'bottom',
                label: {
                    rotation: -45,
                    fontSize: 11
                }
            },
            {
                type: 'number',
                position: 'left',
                title: { text: 'Amount ($)' },
                label: {
                    formatter: ({ value }) => `$${(value / 1000)}k`
                }
            }
        ],
        title: {
            text: 'Purchase Orders vs Invoiced Amount',
            fontSize: 18,
            fontWeight: 'bold'
        },
        legend: {
            position: 'bottom'
        },
        background: {
            fill: '#ffffff'
        }
    };

    // Loader component
    const Loader = () => (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen px-7">
            <div className=" mt-5 w-full max-w-none">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-green-800">
                        Dashboard
                    </h1>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                        <div className="text-green-800 text-sm font-medium mb-1">Total Projects</div>
                        <div className="text-3xl font-bold">{dashboardData.summaryStats.totalProjects}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                        <div className="text-green-800 text-sm font-medium mb-1">Open Projects</div>
                        <div className="text-3xl font-bold">{dashboardData.summaryStats.openProjects}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                        <div className="text-green-800 text-sm font-medium mb-1">WIP Projects</div>
                        <div className="text-3xl font-bold">{dashboardData.summaryStats.wipProjects}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                        <div className="text-green-800 text-sm font-medium mb-1">Closed Projects</div>
                        <div className="text-3xl font-bold">{dashboardData.summaryStats.closedProjects}</div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                    {/* Pie Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 hover:shadow-xl transition-shadow">
                        <div style={{ height: '280px' }}>
                            {loading.projectStatusPie ? <Loader /> : <AgCharts options={pieChartOptions} />}
                        </div>
                    </div>

                    {/* Team Count Bar Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 hover:shadow-xl transition-shadow">
                        <div style={{ height: '280px' }}>
                            {loading.projectTeamCounts ? <Loader /> : <AgCharts options={teamCountBarOptions} />}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                    {/* Project Values Bar Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 hover:shadow-xl transition-shadow">
                        <div style={{ height: '280px' }}>
                            {loading.projectValues ? <Loader /> : <AgCharts options={projectValueBarOptions} />}
                        </div>
                    </div>

                    {/* Invoice Trend Line Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 hover:shadow-xl transition-shadow">
                        <div style={{ height: '280px' }}>
                            {loading.invoiceTrends ? <Loader /> : <AgCharts options={invoiceTrendLineOptions} />}
                        </div>
                    </div>
                </div>

                {/* PO vs Invoice Bar Chart - Full Width */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 hover:shadow-xl transition-shadow">
                        <div style={{ height: '320px' }}>
                            {loading.poVsInvoice ? <Loader /> : <AgCharts options={poVsInvoiceBarOptions} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;