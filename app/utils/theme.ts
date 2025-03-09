import { createTheme } from '@mui/material';

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    '2k': true;
    '2k-wide': true;
    '4k': true;
  }
}

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1300,
      xl: 1536,
      '2k': 2559,
      '2k-wide': 3439,
      '4k': 3839,
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#131C2A',
      dark: '#A7D7FF',
    },
    secondary: {
      main: '#21395E',
      light: '#CDEFF9',
    },
    text: {
      primary: '#131C2A',
      secondary: '#80838D',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        autoComplete: 'new-password',
        slotProps: {
          htmlInput: {
            autoComplete: 'off',
          },
        },
      },
    },
    MuiOutlinedInput: {
      defaultProps: {
        autoComplete: 'off',
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#A7D7FF',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        variant: 'contained',
      },
      styleOverrides: {
        containedSecondary: {
          backgroundColor: '#21395E',
          color: '#A7D7FF',
          '&:hover': {
            backgroundColor: '#131C2A',
            color: '#A7D7FF',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#A7D7FF',
            // color: 'white',
          },
        },
      },
    },

    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
  },
});
