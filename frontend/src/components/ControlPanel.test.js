import React from 'react';
import { render, screen } from '@testing-library/react';
import ControlPanel from './ControlPanel';

test('renders control panel with title', () => {
  // Mock the props the component expects
  const mockProps = {
    onUploadSuccess: jest.fn(),
    geneNames: [],
    onGeneSelect: jest.fn(),
    selectedGene: '',
    isLoading: false,
  };

  render(<ControlPanel {...mockProps} />);

  // Check if the title "Controls" is in the document
  const titleElement = screen.getByText(/Controls/i);
  expect(titleElement).toBeInTheDocument();
});
