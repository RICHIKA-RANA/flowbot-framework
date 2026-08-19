import axios from 'axios';
import config from '@/config/constants';

const backendConnectorHost = config.NEXT_PUBLIC_BACKEND_CONNECTOR_HOST
const backendConnectorKey = config.NEXT_PUBLIC_BACKEND_CONNECTOR_KEY
const whatsAppbackendConnectorHost = config.NEXT_PUBLIC_BACKEND_TEXT_SIMILARITY
const TDB_TTT_SERVICE = config.TDB_TTT_SERVICE
const TDB_TTT_SERVICE_AUTHORIZATION = config.TDB_TTT_SERVICE_AUTHORIZATION

export const axiosTTTInstance = axios.create({
    baseURL: TDB_TTT_SERVICE,
    headers: {
        'Authorization': `Bearer ${TDB_TTT_SERVICE_AUTHORIZATION}`,
        'Accept': 'application/json',
    },
});

export const axiosPDFInstance = axios.create({
    baseURL: `${backendConnectorHost}`,
    headers: {
        'API-KEY': backendConnectorKey
    },
});


export const axiosConvInstance = axios.create({
    baseURL: `${whatsAppbackendConnectorHost}`,
    headers: {
        'API-KEY': backendConnectorKey
    },
});