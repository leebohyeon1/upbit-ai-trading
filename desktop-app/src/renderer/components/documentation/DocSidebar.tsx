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
import { allDocContents as docContents } from './docContents_refactored';

// DocSection type definition moved inline
interface DocSection {
  id: string;
  title: string;
  items: string[];
  subsections?: string[];
}

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
  'advanced-strategies': <AutoAwesome />,
  'coin-settings': <CurrencyBitcoin />,
  'auto-trading': <SmartToy />,
  'calculations': <Calculate />,
  'simulation': <Science />,
  'ai-learning': <Brain />,
  'backtest': <Timeline />,
  'risk-management': <Warning />,
  'news-analysis': <AutoAwesome />,
  'notification': <Notifications />,
  'troubleshooting': <Build />,
  'reference': <MenuBook />,
  'all-features': <MenuBook />,
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
    const section = sections.find(s => s.id === sectionId);
    if (section?.subsections && section.subsections.length > 0) {
      setExpandedSections(prev =>
        prev.includes(sectionId)
          ? prev.filter(id => id !== sectionId)
          : [...prev, sectionId]
      );
      // 하위 항목이 하나뿐이면 바로 선택
      if (section.subsections.length === 1) {
        onSectionSelect(sectionId, section.subsections[0]);
      }
    } else {
      onSectionSelect(sectionId);
    }
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
                  {section.subsections.map((subsectionId) => {
                    // 문서 콘텐츠에서 해당 서브섹션의 제목을 찾아옴
                    const contentKey = `${section.id}.${subsectionId}`;
                    const subsectionContent = docContents[contentKey as keyof typeof docContents];
                    const subsectionTitle = subsectionContent?.title || subsectionId;
                    
                    return (
                      <ListItem key={subsectionId} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          onClick={() => onSectionSelect(section.id, subsectionId)}
                          selected={selectedSection === section.id && selectedSubSection === subsectionId}
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
                            primary={subsectionTitle}
                            primaryTypographyProps={{
                              fontSize: '0.85rem',
                              fontWeight: selectedSubSection === subsectionId ? 500 : 400,
                              color: selectedSubSection === subsectionId 
                                ? theme.palette.primary.main 
                                : theme.palette.text.secondary,
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
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