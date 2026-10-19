import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskDialog } from './TaskDialog';
import { errorMessage } from '../../../lib/http';

vi.mock('../../../lib/http', () => ({
  errorMessage: vi.fn(() => 'Não foi possível criar a tarefa'),
}));

describe('TaskDialog', () => {
  it('cria uma tarefa diária com os dados informados', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<TaskDialog onCreate={onCreate} onClose={onClose} />);
    await user.type(screen.getByLabelText('Título'), 'Ler');
    await user.type(screen.getByLabelText('Descrição'), 'Ler 20 páginas');
    await user.selectOptions(screen.getByLabelText('Tipo'), 'daily');
    await user.selectOptions(screen.getByLabelText('Recorrência'), 'RECURRING');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        title: 'Ler',
        description: 'Ler 20 páginas',
        type: 'daily',
        recurrence: 'RECURRING',
      }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('exibe os dias dessaturados e desabilitados quando o tipo é diário', async () => {
    const user = userEvent.setup();

    render(<TaskDialog onCreate={vi.fn()} onClose={vi.fn()} />);
    await user.selectOptions(screen.getByLabelText('Tipo'), 'daily');

    expect(screen.getByText('Dias da semana')).toBeInTheDocument();
    expect(screen.getByText('Dias da semana').parentElement).toHaveClass('opacity-40');
    expect(screen.getByLabelText('Seg')).toBeDisabled();
  });

  it('exige dia para tarefa personalizada', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();

    render(<TaskDialog onCreate={onCreate} onClose={vi.fn()} />);
    await user.type(screen.getByLabelText('Título'), 'Treinar');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Selecione pelo menos um dia da semana.');
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('envia os dias selecionados na tarefa personalizada', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<TaskDialog onCreate={onCreate} onClose={vi.fn()} />);
    await user.type(screen.getByLabelText('Título'), 'Treinar');
    await user.click(screen.getByLabelText('Seg'));
    await user.click(screen.getByLabelText('Qua'));
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        title: 'Treinar',
        description: null,
        type: 'custom',
        recurrence: 'ONCE',
        daysOfWeek: [1, 3],
      }),
    );
  });

  it('exibe os dias dessaturados e desabilitados quando o tipo é semanal', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<TaskDialog onCreate={onCreate} onClose={vi.fn()} />);
    await user.type(screen.getByLabelText('Título'), 'Planejar semana');
    await user.selectOptions(screen.getByLabelText('Tipo'), 'weekly');

    expect(screen.getByText('Dias da semana')).toBeInTheDocument();
    expect(screen.getByText('Dias da semana').parentElement).toHaveClass('opacity-40');
    expect(screen.getByLabelText('Seg')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        title: 'Planejar semana',
        description: null,
        type: 'weekly',
        recurrence: 'ONCE',
      }),
    );
  });

  it('cria uma tarefa semanal sem exibir o tipo e com dias desabilitados', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <TaskDialog weeklyOnly onCreate={onCreate} onClose={vi.fn()} />,
    );
    expect(screen.getByText('Adicionar tarefa semanal')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tipo')).not.toBeInTheDocument();
    expect(screen.getByText('Dias da semana')).toBeInTheDocument();
    expect(screen.getByLabelText('Seg')).toBeDisabled();
    await user.type(screen.getByLabelText('Título'), 'Planejar semana');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        title: 'Planejar semana',
        description: null,
        type: 'weekly',
        recurrence: 'ONCE',
      }),
    );
  });

  it('mostra erro retornado pela criação', async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error('falha'));
    const user = userEvent.setup();

    render(<TaskDialog onCreate={onCreate} onClose={vi.fn()} />);
    await user.type(screen.getByLabelText('Título'), 'Ler');
    await user.selectOptions(screen.getByLabelText('Tipo'), 'daily');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível criar a tarefa',
    );
    expect(errorMessage).toHaveBeenCalled();
  });

  it('fecha ao clicar em cancelar ou no botão de fechar', () => {
    const onClose = vi.fn();
    render(<TaskDialog onCreate={vi.fn()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
