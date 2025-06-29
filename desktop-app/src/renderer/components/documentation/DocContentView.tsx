import React from 'react';
import { Box, Typography, useTheme, alpha, Divider, Paper } from '@mui/material';
import { allDocContents as docContents } from './docContents_refactored';
import Markdown from 'markdown-to-jsx';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface DocContentProps {
  sectionId: string;
  subSectionId: string | null;
}

const DocContentView: React.FC<DocContentProps> = ({ sectionId, subSectionId }) => {
  const theme = useTheme();
  const contentId = subSectionId ? `${sectionId}.${subSectionId}` : sectionId;
  const content = docContents[contentId as keyof typeof docContents];

  if (!content) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          콘텐츠를 준비 중입니다...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        p: 4,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: alpha(theme.palette.divider, 0.1),
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(theme.palette.primary.main, 0.3),
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.5),
          },
        },
      }}
    >
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {content.title}
      </Typography>
      
      <Divider sx={{ my: 3 }} />

      <Box
        sx={{
          '& h1': { fontSize: '2rem', fontWeight: 600, mt: 4, mb: 2 },
          '& h2': { fontSize: '1.5rem', fontWeight: 600, mt: 3, mb: 2 },
          '& h3': { fontSize: '1.2rem', fontWeight: 600, mt: 2, mb: 1 },
          '& p': { fontSize: '1rem', lineHeight: 1.7, mb: 2 },
          '& ul, & ol': { pl: 3, mb: 2 },
          '& li': { fontSize: '1rem', lineHeight: 1.7, mb: 0.5 },
          '& blockquote': {
            borderLeft: `4px solid ${theme.palette.primary.main}`,
            pl: 2,
            ml: 0,
            my: 2,
            color: theme.palette.text.secondary,
            fontStyle: 'italic',
          },
          '& code': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.common.white, 0.08)
              : alpha(theme.palette.primary.main, 0.1),
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.9em',
            fontFamily: 'monospace',
            color: theme.palette.mode === 'dark' 
              ? theme.palette.primary.light
              : theme.palette.primary.dark,
          },
          '& pre': {
            margin: 0,
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
            '& code': {
              backgroundColor: 'transparent !important',
              padding: '16px !important',
              display: 'block',
            },
          },
          '& table': {
            width: '100%',
            borderCollapse: 'collapse',
            mb: 2,
          },
          '& th, & td': {
            border: `1px solid ${theme.palette.divider}`,
            padding: '8px 12px',
            textAlign: 'left',
          },
          '& th': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.common.white, 0.08)
              : alpha(theme.palette.primary.main, 0.1),
            fontWeight: 600,
          },
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '8px',
            my: 2,
          },
          '& .warning': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.warning.main, 0.15)
              : alpha(theme.palette.warning.main, 0.1),
            border: `1px solid ${theme.palette.warning.main}`,
            borderRadius: '8px',
            padding: '16px',
            my: 2,
          },
          '& .info': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.info.main, 0.15)
              : alpha(theme.palette.info.main, 0.1),
            border: `1px solid ${theme.palette.info.main}`,
            borderRadius: '8px',
            padding: '16px',
            my: 2,
          },
          '& .success': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.success.main, 0.15)
              : alpha(theme.palette.success.main, 0.1),
            border: `1px solid ${theme.palette.success.main}`,
            borderRadius: '8px',
            padding: '16px',
            my: 2,
          },
        }}
      >
        <Markdown
          options={{
            overrides: {
              h1: {
                component: Typography,
                props: { variant: 'h4', gutterBottom: true, sx: { mt: 4, mb: 2, fontWeight: 600 } },
              },
              h2: {
                component: Typography,
                props: { variant: 'h5', gutterBottom: true, sx: { mt: 3, mb: 2, fontWeight: 600 } },
              },
              h3: {
                component: Typography,
                props: { variant: 'h6', gutterBottom: true, sx: { mt: 2, mb: 1, fontWeight: 600 } },
              },
              p: {
                component: Typography,
                props: { variant: 'body1', paragraph: true, sx: { lineHeight: 1.7 } },
              },
              ul: {
                component: Box,
                props: { component: 'ul', sx: { pl: 3, mb: 2 } },
              },
              ol: {
                component: Box,
                props: { component: 'ol', sx: { pl: 3, mb: 2 } },
              },
              li: {
                component: Box,
                props: { component: 'li', sx: { mb: 0.5 } },
              },
              blockquote: {
                component: Box,
                props: { 
                  sx: { 
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    pl: 2,
                    ml: 0,
                    my: 2,
                    color: theme.palette.text.secondary,
                    fontStyle: 'italic',
                  } 
                },
              },
              code: {
                component: ({ children, className }: any) => {
                  if (className && className.startsWith('lang-')) {
                    const language = className.replace('lang-', '');
                    return (
                      <Box sx={{ my: 2 }}>
                        <SyntaxHighlighter
                          style={theme.palette.mode === 'dark' ? vscDarkPlus : vs as any}
                          language={language}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: '8px',
                            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                            padding: '16px',
                          }}
                        >
                          {children}
                        </SyntaxHighlighter>
                      </Box>
                    );
                  }
                  return (
                    <Box
                      component="code"
                      sx={{
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.common.white, 0.08)
                          : alpha(theme.palette.primary.main, 0.1),
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.9em',
                        fontFamily: 'monospace',
                      }}
                    >
                      {children}
                    </Box>
                  );
                },
              },
              div: {
                component: ({ className, children }: any) => {
                  if (className === 'warning') {
                    return (
                      <Paper sx={{
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.warning.main, 0.15)
                          : alpha(theme.palette.warning.main, 0.1),
                        border: `1px solid ${theme.palette.warning.main}`,
                        borderRadius: '8px',
                        padding: '16px',
                        my: 2,
                      }}>
                        {children}
                      </Paper>
                    );
                  }
                  if (className === 'info') {
                    return (
                      <Paper sx={{
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.info.main, 0.15)
                          : alpha(theme.palette.info.main, 0.1),
                        border: `1px solid ${theme.palette.info.main}`,
                        borderRadius: '8px',
                        padding: '16px',
                        my: 2,
                      }}>
                        {children}
                      </Paper>
                    );
                  }
                  if (className === 'success') {
                    return (
                      <Paper sx={{
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.success.main, 0.15)
                          : alpha(theme.palette.success.main, 0.1),
                        border: `1px solid ${theme.palette.success.main}`,
                        borderRadius: '8px',
                        padding: '16px',
                        my: 2,
                      }}>
                        {children}
                      </Paper>
                    );
                  }
                  return <div className={className}>{children}</div>;
                },
              },
            },
          }}
        >
          {content.content}
        </Markdown>
      </Box>
    </Box>
  );
};

export default DocContentView;