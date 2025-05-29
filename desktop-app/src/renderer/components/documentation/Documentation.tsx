import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Paper, 
  useTheme, 
  alpha, 
  TextField, 
  Typography, 
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import DocSidebar from './DocSidebar';
import DocContentView from './DocContentView';
import { documentSections as docSections, allDocContents as docContents } from './docContents_refactored';

const Documentation: React.FC = () => {
  const theme = useTheme();
  const [selectedSection, setSelectedSection] = useState('getting-started');
  const [selectedSubSection, setSelectedSubSection] = useState<string | null>('introduction');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // docSections를 DocSidebar가 예상하는 형태로 변환
  const sidebarSections = useMemo(() => {
    return Object.entries(docSections).map(([id, section]) => ({
      id,
      title: section.title,
      items: section.items,
      subsections: section.items.map(item => {
        // "getting-started.requirements" -> "requirements"
        const parts = item.split('.');
        return parts.length > 1 ? parts.slice(1).join('.') : item;
      })
    }));
  }, []);

  // 검색 기능
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const results: Array<{
      sectionId: string;
      subSectionId?: string;
      title: string;
      breadcrumb: string;
      snippet: string;
      matchScore: number;
    }> = [];
    
    const query = searchQuery.toLowerCase();
    
    // 모든 문서 컨텐츠를 검색
    Object.entries(docContents).forEach(([contentId, content]) => {
      const parts = contentId.split('.');
      const sectionId = parts[0];
      const subSectionId = parts.length > 1 ? parts.slice(1).join('.') : undefined;
      
      const sectionInfo = docSections[sectionId as keyof typeof docSections];
      const sectionTitle = sectionInfo?.title || sectionId;
      
      // 제목 검색
      if (content.title.toLowerCase().includes(query)) {
        results.push({
          sectionId,
          subSectionId,
          title: content.title,
          breadcrumb: subSectionId ? `${sectionTitle} > ${content.title}` : content.title,
          snippet: content.content.substring(0, 150) + '...',
          matchScore: content.title.toLowerCase().indexOf(query) === 0 ? 3 : 2
        });
      }
      // 내용 검색
      else if (content.content.toLowerCase().includes(query)) {
        const contentIndex = content.content.toLowerCase().indexOf(query);
        const start = Math.max(0, contentIndex - 50);
        const end = Math.min(content.content.length, contentIndex + 100);
        const snippet = (start > 0 ? '...' : '') + 
                       content.content.substring(start, end) + 
                       (end < content.content.length ? '...' : '');
        
        results.push({
          sectionId,
          subSectionId,
          title: content.title,
          breadcrumb: subSectionId ? `${sectionTitle} > ${content.title}` : content.title,
          snippet,
          matchScore: 1
        });
      }
    });
    
    // 매칭 점수와 제목순으로 정렬
    return results
      .sort((a, b) => b.matchScore - a.matchScore || a.title.localeCompare(b.title))
      .slice(0, 20); // 최대 20개 결과
  }, [searchQuery]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.length >= 2);
  };

  const handleSearchResultClick = (sectionId: string, subSectionId?: string) => {
    setSelectedSection(sectionId);
    setSelectedSubSection(subSectionId || null);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* 사이드바 */}
      <Paper
        elevation={0}
        sx={{
          width: 280,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 검색 바 */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField
            fullWidth
            size="small"
            placeholder="문서 검색..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <Clear 
                    color="action" 
                    sx={{ cursor: 'pointer' }}
                    onClick={clearSearch}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </Box>

        {/* 검색 결과 또는 일반 사이드바 */}
        {showSearchResults ? (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                검색 결과 ({searchResults.length}개)
              </Typography>
              {searchResults.length > 0 ? (
                <List dense>
                  {searchResults.map((result, index) => (
                    <React.Fragment key={`${result.sectionId}-${result.subSectionId}-${index}`}>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => handleSearchResultClick(result.sectionId, result.subSectionId)}
                          sx={{ 
                            borderRadius: 1,
                            mb: 1,
                            flexDirection: 'column',
                            alignItems: 'stretch'
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="body2" fontWeight="medium" noWrap>
                              {result.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                              {result.breadcrumb}
                            </Typography>
                            {result.snippet && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.3
                                }}
                              >
                                {result.snippet}
                              </Typography>
                            )}
                          </Box>
                        </ListItemButton>
                      </ListItem>
                      {index < searchResults.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  검색 결과가 없습니다.
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <DocSidebar
            sections={sidebarSections}
            selectedSection={selectedSection}
            selectedSubSection={selectedSubSection}
            onSectionSelect={(sectionId, subSectionId) => {
              setSelectedSection(sectionId);
              setSelectedSubSection(subSectionId || null);
            }}
          />
        )}
      </Paper>

      {/* 콘텐츠 영역 */}
      <Box sx={{ flex: 1, ml: 3, overflow: 'hidden' }}>
        <Paper
          elevation={0}
          sx={{
            height: '100%',
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
          }}
        >
          <DocContentView
            sectionId={selectedSection}
            subSectionId={selectedSubSection}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default Documentation;