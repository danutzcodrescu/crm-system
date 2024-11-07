import { createTheme } from '@mui/material';

export const theme = createTheme({
  components: {
    MuiTextField: {
      defaultProps: {
        slotProps: {
          htmlInput: {
            autoComplete: 'one-time-code',
          },
        },
      },
    },
    MuiOutlinedInput: {
      defaultProps: {
        autoComplete: 'one-time-code',
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
