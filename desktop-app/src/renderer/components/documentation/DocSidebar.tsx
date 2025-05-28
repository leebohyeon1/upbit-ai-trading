import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  RocketLaunch,
  Settings,
  School,
  Computer,
  TrendingUp,
  CurrencyBitcoin,
  SmartToy,
  Calculate,
  Science,
  Psychology as Brain,
  Timeline,
  Warning,
  Notifications,
  Build,
  AutoAwesome,
  MenuBook,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { DocSection } from './docContents';

interface DocSidebarProps {
  sections: DocSection[];
  selectedSection: string;
  selectedSubSection: string | null;
  onSectionSelect: (sectionId: string, subSectionId?: string) => void;
}

const sectionIcons: Record<string, React.ReactElement> = {
  'getting-started': <RocketLaunch />,
  'initial-setup': <Settings />,
  'core-concepts': <School />,
  'interface': <Computer />,
  'trading-strategy': <TrendingUp />,
  'coin-settings': <CurrencyBitcoin />,
  'auto-trading': <SmartToy />,
  'calculations': <Calculate />,
  'simulation': <Science />,
  'ai-learning': <Brain />,
  'backtest': <Timeline />,
  'risk-management': <Warning />,
  'notifications': <Notifications />,
  'troubleshooting': <Build />,
  'advanced': <AutoAwesome />,
  'reference': <MenuBook />,
};

const DocSidebar: React.FC<DocSidebarProps> = ({
  sections,
  selectedSection,
  selectedSubSection,
  onSectionSelect,
}) => {
  const theme = useTheme();
  const [expandedSections, setExpandedSections] = React.useState<string[]>([selectedSection]);

  const handleSectionClick = (sectionId: string) => {
    if (sections.find(s => s.id === sectionId)?.subsections) {
      setExpandedSections(prev =>
        prev.includes(sectionId)
          ? prev.filter(id => id !== sectionId)
          : [...prev, sectionId]
      );
    }
    onSectionSelect(sectionId);
  };

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
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
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="bold">
          📚 사용 설명서
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {sections.map((section) => (
          <React.Fragment key={section.id}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleSectionClick(section.id)}
                selected={selectedSection === section.id && !selectedSubSection}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: theme.palette.primary.main }}>
                  {sectionIcons[section.id] || <MenuBook />}
                </ListItemIcon>
                <ListItemText 
                  primary={section.title}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: selectedSection === section.id ? 600 : 400,
                  }}
                />
                {section.subsections && (
                  expandedSections.includes(section.id) ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>

            {section.subsections && (
              <Collapse in={expandedSections.includes(section.id)} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 2 }}>
                  {section.subsections.map((subsection) => (
                    <ListItem key={subsection.id} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => onSectionSelect(section.id, subsection.id)}
                        selected={selectedSection === section.id && selectedSubSection === subsection.id}
                        sx={{
                          borderRadius: 1,
                          pl: 3,
                          '&.Mui-selected': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            borderLeft: `3px solid ${theme.palette.primary.main}`,
                            pl: 2.6,
                          },
                        }}
                      >
                        <ListItemText
                          primary={subsection.title}
                          primaryTypographyProps={{
                            fontSize: '0.85rem',
                            fontWeight: selectedSubSection === subsection.id ? 500 : 400,
                            color: selectedSubSection === subsection.id 
                              ? theme.palette.primary.main 
                              : theme.palette.text.secondary,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default DocSidebar;