import { createCampaign, dashboard, logout, stats, profile, withdraw } from '../assets';

export const navlinks = [
  {
    name: 'dashboard',
    imgUrl: dashboard,
    link: '/',
  },
  {
    name: 'campaign',
    imgUrl: createCampaign,
    link: '/create-campaign',
  },
  {
    name: "stats",
    imgUrl: stats,   
    link: "/stats",
  },
  {
    name: 'withdraw',
    imgUrl: withdraw,
    link: '/campaign-finance',
    disabled: false,
  },
  {
    name: 'profile',
    imgUrl: profile,
    link: '/profile',
  },
  {
    name: 'logout',
    imgUrl: logout,
    link: '/',
    disabled:false,
  },
];
