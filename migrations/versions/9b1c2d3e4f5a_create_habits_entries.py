"""create habits and entries tables

Revision ID: 9b1c2d3e4f5a
Revises: e31396db40b1
Create Date: 2026-07-28 07:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9b1c2d3e4f5a'
down_revision = 'e31396db40b1'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'habits',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('icon', sa.String(length=64), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'entries',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('habit_id', sa.String(length=36), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('done', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['habit_id'], ['habits.id'], ondelete='CASCADE')
    )

    op.create_index('ix_entries_habit_date', 'entries', ['habit_id', 'date'])


def downgrade():
    op.drop_index('ix_entries_habit_date', table_name='entries')
    op.drop_table('entries')
    op.drop_table('habits')
