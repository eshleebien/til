These queries helped me to optimize autovacuum parameters

-- see currently active autovacuum and see if it's waiting
```sql
SELECT query_start, datname, usename, pid, state, current_timestamp - xact_start AS xact_runtime, query, waiting --wait_event,
	FROM pg_stat_activity 
WHERE query LIKE '%autovacuum%' AND query NOT LIKE '%pg_stat_activity%'
ORDER BY xact_start;
```

-- see long running transactions
```sql
SELECT pid, datname, usename, state, backend_xmin, query
FROM pg_stat_activity
WHERE backend_xmin IS NOT NULL
ORDER BY age(backend_xmin) DESC;
```

-- see abandoned replication slots
```sql
SELECT slot_name, slot_type, database, xmin
FROM pg_replication_slots
ORDER BY age(xmin) DESC;
```

-- see orphaned prepared transactions;
```sql
SELECT gid, prepared, owner, database, transaction AS xmin
FROM pg_prepared_xacts
ORDER BY age(transaction) DESC;
```

-- live tup vs dead tup ratio
```sql
SELECT relname, n_live_tup, n_dead_tup, trunc(100*n_dead_tup/(n_live_tup+1))::float "ratio%",
to_char(last_autovacuum, 'YYYY-MM-DD HH24:MI:SS') as autovacuum_date, 
to_char(last_autoanalyze, 'YYYY-MM-DD HH24:MI:SS') as autoanalyze_date
FROM pg_stat_all_tables 
ORDER BY last_autovacuum;
```



-- query age of a database (XID age)
```sql
select datname, age(datfrozenxid) from pg_database order 
by age(datfrozenxid) desc limit 20;
```

-- See table eligible for vacuum
```sql
 WITH vbt AS (SELECT setting AS autovacuum_vacuum_threshold FROM 
pg_settings WHERE name = 'autovacuum_vacuum_threshold')
    , vsf AS (SELECT setting AS autovacuum_vacuum_scale_factor FROM 
pg_settings WHERE name = 'autovacuum_vacuum_scale_factor')
    , fma AS (SELECT setting AS autovacuum_freeze_max_age FROM 
pg_settings WHERE name = 'autovacuum_freeze_max_age')
    , sto AS (select opt_oid, split_part(setting, '=', 1) as param, 
split_part(setting, '=', 2) as value from (select oid opt_oid, 
unnest(reloptions) setting from pg_class) opt)
SELECT
    '"'||ns.nspname||'"."'||c.relname||'"' as relation
    , pg_size_pretty(pg_table_size(c.oid)) as table_size
    , age(relfrozenxid) as xid_age
    , coalesce(cfma.value::float, autovacuum_freeze_max_age::float) 
autovacuum_freeze_max_age
    , (coalesce(cvbt.value::float, autovacuum_vacuum_threshold::float) 
+ coalesce(cvsf.value::float,autovacuum_vacuum_scale_factor::float) * 
c.reltuples) as autovacuum_vacuum_tuples
    , n_dead_tup as dead_tuples
FROM pg_class c join pg_namespace ns on ns.oid = c.relnamespace
join pg_stat_all_tables stat on stat.relid = c.oid
join vbt on (1=1) join vsf on (1=1) join fma on (1=1)
left join sto cvbt on cvbt.param = 'autovacuum_vacuum_threshold' and 
c.oid = cvbt.opt_oid
left join sto cvsf on cvsf.param = 'autovacuum_vacuum_scale_factor' and 
c.oid = cvsf.opt_oid
left join sto cfma on cfma.param = 'autovacuum_freeze_max_age' and 
c.oid = cfma.opt_oid
WHERE c.relkind = 'r' and nspname <> 'pg_catalog'
and (
    age(relfrozenxid) >= coalesce(cfma.value::float, 
autovacuum_freeze_max_age::float)
    or
    coalesce(cvbt.value::float, autovacuum_vacuum_threshold::float) + 
coalesce(cvsf.value::float,autovacuum_vacuum_scale_factor::float) * 
c.reltuples <= n_dead_tup
   -- or 1 = 1
)
ORDER BY age(relfrozenxid) DESC LIMIT 50;
```

-- Play with scale factor values
```sql
WITH sfactor as (VALUES ('0.05')),
base as (VALUES ('100000'))
SELECT 
    (table sfactor) as scalefactor_pct,
    (table base)::float8 as base_threshold,
    (n_live_tup * (table sfactor)::float8 + (table base)::float8) as vct,
    CASE  when n_live_tup > 0 then
    ((n_live_tup * (table sfactor)::float8 + (table base)::float8) / n_live_tup) * 100 
    else 100 end as vcpt,
    schemaname
    ,relname
    ,n_live_tup
    ,n_dead_tup
    ,last_autovacuum,
    n_dead_tup
    /(n_live_tup
      * (table sfactor)::float8
      + (table base)::float8)
FROM pg_stat_all_tables
ORDER BY n_dead_tup
    /(n_live_tup
      * (table sfactor)::float8
      + (table base)::float8)
     DESC;
```

--See blocking queries
```sql
SELECT current_timestamp as date, blocked_locks.pid     AS blocked_pid,
         blocked_activity.usename  AS blocked_user,
         blocking_locks.pid     AS blocking_pid,
         blocking_activity.usename AS blocking_user,
         blocked_activity.query    AS blocked_statement,
         blocking_activity.query   AS current_statement_in_blocking_process
   FROM  pg_catalog.pg_locks         blocked_locks
    JOIN pg_catalog.pg_stat_activity blocked_activity  ON blocked_activity.pid = blocked_locks.pid
    JOIN pg_catalog.pg_locks         blocking_locks
        ON blocking_locks.locktype = blocked_locks.locktype
        AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
        AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
        AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
        AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
        AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
        AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
        AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
        AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
        AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
        AND blocking_locks.pid != blocked_locks.pid

    JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
   WHERE NOT blocked_locks.GRANTED and blocked_activity.query_start > NOW() - INTERVAL '1 minute';
```

--Set autovacuum parameters per table
```sql
ALTER TABLE schema.table_name SET (autovacuum_vacuum_cost_limit = 1300);
ALTER TABLE schema.table_name SET (autovacuum_vacuum_scale_factor = 0.01);
```
--These commands (SET attributes) will only acquire SHARE UPDATE EXCLUSIVE lock which is generally safe from transactions
