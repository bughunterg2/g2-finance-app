import React from 'react';
import { Box, Breadcrumbs, Typography, Link } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    path?: string;
  }>;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBreadcrumbClick = (path: string) => {
    navigate(path);
  };

  // Generate breadcrumbs from current path if not provided
  const getDefaultBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbItems = pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      return { label, path };
    });
    return breadcrumbItems;
  };

  const breadcrumbItems = breadcrumbs || getDefaultBreadcrumbs();

  return (
    <Box sx={{ mb: 3, width: '100%', mr: -3, pr: 3 }}>
      {/* Breadcrumbs */}
      {breadcrumbItems.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 2, width: '100%' }}
        >
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            
            if (isLast || !item.path) {
              return (
                <Typography key={index} color="text.primary" fontSize="0.875rem">
                  {item.label}
                </Typography>
              );
            }
            
            return (
              <Link
                key={index}
                component="button"
                variant="body2"
                onClick={() => handleBreadcrumbClick(item.path!)}
                sx={{
                  textDecoration: 'none',
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main',
                  },
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      {/* Title and Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {actions && (
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
