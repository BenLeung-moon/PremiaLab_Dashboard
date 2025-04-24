import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, Box, Typography, CircularProgress, Avatar } from '@mui/material';
import { useStockSearch, StockInfo } from '../../hooks/useStockSearch';

interface StockSearchProps {
  label?: string;
  placeholder?: string;
  value?: StockInfo | null;
  onChange: (stock: StockInfo | null) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
}

export const StockSearch: React.FC<StockSearchProps> = ({
  label = '股票搜索',
  placeholder = '输入股票代码或名称',
  value = null,
  onChange,
  error = false,
  helperText = '',
  disabled = false,
  required = false,
  fullWidth = true,
}) => {
  console.log('[StockSearch 组件] 渲染开始', { label, placeholder, value });
  
  const { searchTerm, setSearchTerm, stocks, loading, initialized, error: hookError } = useStockSearch();
  const [inputValue, setInputValue] = useState('');
  
  // 添加调试效果，监控stocks和initialized
  useEffect(() => {
    console.log('[StockSearch 组件] 初始化状态变化:', initialized);
    console.log('[StockSearch 组件] 可用股票数量:', stocks.length);
    if (hookError) {
      console.error('[StockSearch 组件] 错误:', hookError);
    }
  }, [initialized, stocks, hookError]);

  // 选项渲染
  const renderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: StockInfo) => {
    console.log('[StockSearch 组件] 渲染选项:', option.symbol);
    return (
      <Box component="li" {...props}>
        <Box display="flex" alignItems="center" width="100%">
          <Avatar 
            sx={{ 
              width: 24, 
              height: 24, 
              bgcolor: 'primary.main', 
              fontSize: '0.75rem',
              mr: 1 
            }}
          >
            {option.symbol.slice(0, 2)}
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="body1" component="div">
              {option.symbol}
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              {option.englishName || option.name}
              {option.chineseName && ` (${option.chineseName})`}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  // 获取选项标签
  const getOptionLabel = (option: StockInfo) => {
    const label = `${option.symbol} - ${option.englishName || option.name}${option.chineseName ? ` (${option.chineseName})` : ''}`;
    console.log('[StockSearch 组件] 选项标签:', label);
    return label;
  };

  console.log('[StockSearch 组件] 当前状态:', {
    initialized,
    loading,
    stocksCount: stocks.length,
    inputValue,
    searchTerm
  });

  return (
    <Autocomplete
      fullWidth={fullWidth}
      disabled={disabled || !initialized}
      options={stocks}
      loading={loading}
      value={value}
      onChange={(_, newValue) => {
        console.log('[StockSearch 组件] 选中值变化:', newValue?.symbol);
        onChange(newValue);
      }}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        console.log('[StockSearch 组件] 输入值变化:', newInputValue);
        setInputValue(newInputValue);
        setSearchTerm(newInputValue);
      }}
      isOptionEqualToValue={(option, value) => option.symbol === value.symbol}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      filterOptions={(x) => x} // 禁用内置过滤，使用自定义后端过滤
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
}; 