import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAnalytics } from '../redux/apiCalls';
import { 
  Grid, Card, CardContent, Typography, Box, 
  CircularProgress, Tabs, Tab, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import ApexCharts from 'react-apexcharts';

const Analytics = () => {
  const dispatch = useDispatch();
  const { merchantId } = useSelector(state => state.auth);
  const { analytics, loading } = useSelector(state => state.analytics);
  const [timeframe, setTimeframe] = useState('30');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (merchantId) {
      fetchAnalytics(dispatch, merchantId, timeframe);
    }
  }, [dispatch, merchantId, timeframe]);

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const paymentMethodOptions = {
    chart: {
      type: 'donut',
    },
    labels: ['Mobile', 'Card', 'Bank'],
    colors: ['#43E97B', '#667EEA', '#FFC107'],
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const paymentMethodSeries = [
    analytics.payment_method_distribution?.mobile || 0,
    analytics.payment_method_distribution?.card || 0,
    analytics.payment_method_distribution?.bank || 0,
  ];

  const statusDistributionOptions = {
    chart: {
      type: 'pie',
    },
    labels: ['Paid', 'Pending', 'Failed'],
    colors: ['#43E97B', '#FFC107', '#FF758C'],
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const statusDistributionSeries = [
    analytics.status_distribution?.paid || 0,
    analytics.status_distribution?.pending || 0,
    analytics.status_distribution?.failed || 0,
  ];

  const dailyPerformanceOptions = {
    chart: {
      height: 350,
      type: 'line',
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    xaxis: {
      categories: analytics.dates || [],
    },
    yaxis: [
      {
        title: {
          text: 'Orders',
        },
      },
      {
        opposite: true,
        title: {
          text: 'Revenue ($)',
        },
      },
    ],
    colors: ['#667EEA', '#43E97B'],
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  const dailyPerformanceSeries = [
    {
      name: 'Orders',
      type: 'line',
      data: analytics.order_counts || [],
    },
    {
      name: 'Revenue',
      type: 'line',
      data: analytics.revenue_data || [],
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Business Analytics
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Payment Methods" />
          <Tab label="Status Distribution" />
        </Tabs>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={timeframe}
            label="Timeframe"
            onChange={handleTimeframeChange}
            size="small"
          >
            <MenuItem value="7">Last 7 Days</MenuItem>
            <MenuItem value="30">Last 30 Days</MenuItem>
            <MenuItem value="90">Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Daily Performance
                </Typography>
                <ApexCharts
                  options={dailyPerformanceOptions}
                  series={dailyPerformanceSeries}
                  type="line"
                  height={350}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Methods Distribution
                </Typography>
                <ApexCharts
                  options={paymentMethodOptions}
                  series={paymentMethodSeries}
                  type="donut"
                  height={350}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Status Distribution
                </Typography>
                <ApexCharts
                  options={statusDistributionOptions}
                  series={statusDistributionSeries}
                  type="pie"
                  height={350}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analytics;