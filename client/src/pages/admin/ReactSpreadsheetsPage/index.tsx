import React from 'react';
import { Box, Card as MuiCard, CardContent, Typography } from '@mui/material';
import Spreadsheet from 'react-spreadsheet';
import type { CellBase, Matrix } from 'react-spreadsheet';

const ReactSpreadsheetsPage: React.FC = () => {
  const [data, setData] = React.useState<Matrix<CellBase<any>>>([
    [{ value: 'Item' }, { value: 'Qty' }, { value: 'Price' }],
    [{ value: 'A' }, { value: 1 }, { value: 10000 }],
    [{ value: 'B' }, { value: 2 }, { value: 15000 }],
  ]);

  return (
    <Box>
      <MuiCard>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>React Spreadsheet</Typography>
          <Spreadsheet data={data} onChange={setData} />
        </CardContent>
      </MuiCard>
    </Box>
  );
};

export default ReactSpreadsheetsPage;


