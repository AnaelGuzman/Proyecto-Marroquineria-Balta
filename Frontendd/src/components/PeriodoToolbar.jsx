import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Box, Typography, Button, Chip } from '@mui/material';
import { ArrowBackIosNew, ArrowForwardIos, Today } from '@mui/icons-material';
import './PeriodoToolbar.css';

export default function PeriodoToolbar({
  icon: Icon,
  titulo,
  descripcion,
  periodoLabel,
  onPrev,
  onNext,
  onReset,
  className
}) {
  return (
    <Box className={`periodo-toolbar-wrapper ${className ?? ''}`}>
      <Card className="periodo-toolbar-card">
        <CardContent className="periodo-toolbar-content">
          <Box className="periodo-toolbar-info">
            {Icon && <Icon className="periodo-toolbar-icon" />}
            <div>
              {descripcion && (
                <Typography className="periodo-toolbar-eyebrow">
                  {descripcion}
                </Typography>
              )}
              <Typography className="periodo-toolbar-title">
                {titulo}
              </Typography>
            </div>
          </Box>

          <Box className="periodo-toolbar-controls">
            {periodoLabel && (
              <Chip
                label={periodoLabel}
                size="small"
                className="periodo-toolbar-chip"
              />
            )}
            <div className="periodo-toolbar-buttons">
              {onPrev && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onPrev}
                  startIcon={<ArrowBackIosNew fontSize="inherit" />}
                >
                  Anterior
                </Button>
              )}
              {onReset && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onReset}
                  startIcon={<Today fontSize="inherit" />}
                >
                  Actual
                </Button>
              )}
              {onNext && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onNext}
                  endIcon={<ArrowForwardIos fontSize="inherit" />}
                >
                  Siguiente
                </Button>
              )}
            </div>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

PeriodoToolbar.propTypes = {
  icon: PropTypes.elementType,
  titulo: PropTypes.string.isRequired,
  descripcion: PropTypes.string,
  periodoLabel: PropTypes.string,
  onPrev: PropTypes.func,
  onNext: PropTypes.func,
  onReset: PropTypes.func,
  className: PropTypes.string
};
