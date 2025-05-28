import React, { useState } from 'react';
import { Box, Paper, useTheme, alpha } from '@mui/material';
import DocSidebar from './DocSidebar';
import DocContentView from './DocContentView';
import { docSections } from './docContents';

const Documentation: React.FC = () => {
  const theme = useTheme();
  const [selectedSection, setSelectedSection] = useState('getting-started');
  const [selectedSubSection, setSelectedSubSection] = useState<string | null>(null);

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
        <DocSidebar
          sections={docSections}
          selectedSection={selectedSection}
          selectedSubSection={selectedSubSection}
          onSectionSelect={(sectionId, subSectionId) => {
            setSelectedSection(sectionId);
            setSelectedSubSection(subSectionId || null);
          }}
        />
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