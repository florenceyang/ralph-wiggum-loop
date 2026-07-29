"""create todo_groups and todo_items tables

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-07-29 06:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'todo_groups',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'todo_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['group_id'], ['todo_groups.id'], ondelete='CASCADE')
    )

    op.create_index('ix_todo_items_group_order', 'todo_items', ['group_id', 'order'])


def downgrade():
    op.drop_index('ix_todo_items_group_order', table_name='todo_items')
    op.drop_table('todo_items')
    op.drop_table('todo_groups')
