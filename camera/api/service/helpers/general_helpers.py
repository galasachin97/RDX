import functools, time

def retry(exceptions, delay=0, times=2):
    def outer_wrapper(function):
        @functools.wraps(function)
        def inner_wrapper(*args, **kwargs):
            final_excep = None  
            for counter in range(times):
                if counter > 0:
                    time.sleep(delay)
                final_excep = None
                try:
                    value = function(*args, **kwargs)
                    return value
                except (exceptions) as e:
                    final_excep = e
                    pass #or log it

            if final_excep is not None:
                raise final_excep
        return inner_wrapper
    return outer_wrapper