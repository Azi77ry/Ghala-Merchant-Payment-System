import axios from 'axios';
import { loginSuccess, logout } from './authSlice';
import { setOrders, addOrder, updateOrder } from './ordersSlice';
import { setAnalytics } from './analyticsSlice';
import { setPaymentMethods } from './paymentSlice';

const API_URL = 'http://localhost:5000/api';

export const loginUser = async (dispatch, credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    dispatch(loginSuccess({ token, user }));
    return true;
  } catch (error) {
    dispatch(logout());
    return false;
  }
};

export const fetchOrders = async (dispatch, merchantId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/orders/${merchantId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    dispatch(setOrders(response.data));
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
};

export const fetchAnalytics = async (dispatch, merchantId, days = '30') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/analytics/summary/${merchantId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { days },
    });
    dispatch(setAnalytics(response.data));
  } catch (error) {
    console.error('Error fetching analytics:', error);
  }
};

export const createNewOrder = async (dispatch, merchantId, orderData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/order/${merchantId}`, orderData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    dispatch(addOrder(response.data.order));
    return true;
  } catch (error) {
    console.error('Error creating order:', error);
    return false;
  }
};